
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- HELPER: CHECK ADMIN ---
async function assertAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'Yêu cầu đăng nhập để thực hiện hành động này.'
    );
  }
  const db = admin.firestore();
  const callerUid = context.auth.uid;
  const callerUserRef = db.collection('users').doc(callerUid);
  const callerDoc = await callerUserRef.get();

  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Chỉ Admin mới có quyền thực hiện hành động này.'
    );
  }
  return db;
}

/**
 * Cloud Function: approveTransaction
 * Trigger: Callable from Client
 * Logic: Atomic Update Transaction Status + User Role
 */
exports.approveTransaction = functions.https.onCall(async (data, context) => {
  const db = await assertAdmin(context); // Verify Admin

  const { transactionId } = data;
  if (!transactionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Thiếu Transaction ID.');
  }

  const transactionRef = db.collection('transactions').doc(transactionId);
  const callerUid = context.auth.uid;

  return db.runTransaction(async (t) => {
    const transDoc = await t.get(transactionRef);

    if (!transDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Không tìm thấy giao dịch.');
    }

    const transData = transDoc.data();
    
    if (transData.status === 'approved') {
      return { message: 'Giao dịch này đã được duyệt trước đó.', success: true };
    }

    const targetUid = transData.uid;
    const newRole = transData.plan;

    if (!targetUid || !newRole) {
       throw new functions.https.HttpsError('data-loss', 'Dữ liệu giao dịch thiếu uid hoặc plan.');
    }

    const targetUserRef = db.collection('users').doc(targetUid);

    // Update User Role
    t.update(targetUserRef, { 
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });

    // Update Transaction Status
    t.update(transactionRef, { 
      status: 'approved',
      approvedBy: callerUid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, uid: targetUid, newRole: newRole };
  });
});

/**
 * Cloud Function: adminUpdateUser
 * Trigger: Callable from Client (Admin Dashboard -> Users Tab)
 * Logic: Manually set Role or Status (Active/Banned) for a user
 */
exports.adminUpdateUser = functions.https.onCall(async (data, context) => {
  const db = await assertAdmin(context); // Verify Admin

  const { targetUid, role, status } = data;

  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Thiếu Target UID.');
  }

  // Validate inputs to prevent bad data
  const validRoles = ['free', 'silver', 'gold', 'admin'];
  const validStatus = ['active', 'banned'];

  const updateData = {
    updatedBy: context.auth.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (role && validRoles.includes(role)) {
    updateData.role = role;
  }

  if (status && validStatus.includes(status)) {
    updateData.status = status;
  }

  try {
    await db.collection('users').doc(targetUid).update(updateData);
    return { success: true, message: `Updated user ${targetUid}` };
  } catch (error) {
    console.error("Error updating user:", error);
    throw new functions.https.HttpsError('internal', 'Lỗi khi cập nhật User: ' + error.message);
  }
});
