// @ts-nocheck
/**
 * Automated Comprehensive Test Suite for Kyeto Chat Platform
 * Verifies Auth, Security, E2EE Keys, Notifications, Groups, Polls, Message Management, and AI Integration.
 */

const BASE_URL = "http://localhost:5001/api";

const testResults = [];

function logTest(category, name, passed, details = "") {
  testResults.push({ category, name, passed, details });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`[${category}] ${status} - ${name} ${details ? `(${details})` : ""}`);
}

async function runSuite() {
  console.log("\n=======================================================");
  console.log("🧪 STARTING KYETO CHAT AUTOMATED TEST SUITE");
  console.log("=======================================================\n");

  let testUserToken = null;
  let testUserId = null;
  const testUsername = `testuser_${Date.now()}`;
  const testEmail = `${testUsername}@example.com`;
  const testPassword = "Password123!";

  // -------------------------------------------------------------
  // 1. AUTH & SECURITY TEST SUITE (Phase 1A)
  // -------------------------------------------------------------
  console.log("--- 1. AUTHENTICATION & SECURITY TESTS ---");

  // 1.1 User Registration
  try {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword,
        displayName: "Test Suite User",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      logTest("Auth & Security", "User Registration (Sign Up)", true);
    } else {
      logTest("Auth & Security", "User Registration (Sign Up)", false, data.message);
    }
  } catch (err) {
    logTest("Auth & Security", "User Registration (Sign Up)", false, err.message);
  }

  // 1.2 User Login
  try {
    const res = await fetch(`${BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
      }),
    });
    const data = await res.json();
    if (res.ok && data.accessToken) {
      testUserToken = data.accessToken;
      testUserId = data.user?.id || data.user?._id;
      logTest("Auth & Security", "User Sign In & JWT Token Generation", true, `UserID: ${testUserId}`);
    } else {
      logTest("Auth & Security", "User Sign In & JWT Token Generation", false, data.message);
    }
  } catch (err) {
    logTest("Auth & Security", "User Sign In & JWT Token Generation", false, err.message);
  }

  // 1.2.1 Reject Wrong Password (401 Unauthorized)
  try {
    const res = await fetch(`${BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        password: "WrongPassword999!",
      }),
    });
    const data = await res.json();
    if (res.status === 401 && data.message === "Sai tên đăng nhập hoặc mật khẩu") {
      logTest("Auth & Security", "Password Verification & 401 Rejection", true, data.message);
    } else {
      logTest("Auth & Security", "Password Verification & 401 Rejection", false, `Status: ${res.status}, Msg: ${data.message}`);
    }
  } catch (err) {
    logTest("Auth & Security", "Password Verification & 401 Rejection", false, err.message);
  }

  // 1.3 2FA Setup Generation
  try {
    const res = await fetch(`${BASE_URL}/auth/2fa/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
    });
    const data = await res.json();
    if (res.ok && data.qrCodeDataUrl && data.secret) {
      logTest("Auth & Security", "2FA QR Code & Secret Generation", true);
    } else {
      logTest("Auth & Security", "2FA QR Code & Secret Generation", false, data.message);
    }
  } catch (err) {
    logTest("Auth & Security", "2FA QR Code & Secret Generation", false, err.message);
  }

  // 1.4 Forgot Password Flow Trigger
  try {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      logTest("Auth & Security", "Forgot Password & Nodemailer Token Trigger", true);
    } else {
      logTest("Auth & Security", "Forgot Password & Nodemailer Token Trigger", false, data.message);
    }
  } catch (err) {
    logTest("Auth & Security", "Forgot Password & Nodemailer Token Trigger", false, err.message);
  }

  // -------------------------------------------------------------
  // 2. E2EE KEY EXCHANGE TEST SUITE (Phase 1B)
  // -------------------------------------------------------------
  console.log("\n--- 2. E2EE KEY EXCHANGE TESTS ---");

  const dummyPublicKey = "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE_TEST_ECDH_PUBLIC_KEY_" + Date.now();

  // 2.1 Upload ECDH Public Key
  try {
    const res = await fetch(`${BASE_URL}/users/keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ publicKey: dummyPublicKey }),
    });
    const data = await res.json();
    if (res.ok) {
      logTest("E2EE Key Exchange", "Upload Client ECDH Public Key", true);
    } else {
      logTest("E2EE Key Exchange", "Upload Client ECDH Public Key", false, data.message);
    }
  } catch (err) {
    logTest("E2EE Key Exchange", "Upload Client ECDH Public Key", false, err.message);
  }

  // 2.2 Retrieve User ECDH Public Key
  try {
    const res = await fetch(`${BASE_URL}/users/${testUserId}/key`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (res.ok && data.publicKey === dummyPublicKey) {
      logTest("E2EE Key Exchange", "Fetch Partner ECDH Public Key for E2EE Negotiation", true);
    } else {
      logTest("E2EE Key Exchange", "Fetch Partner ECDH Public Key for E2EE Negotiation", false, data.message);
    }
  } catch (err) {
    logTest("E2EE Key Exchange", "Fetch Partner ECDH Public Key for E2EE Negotiation", false, err.message);
  }

  // -------------------------------------------------------------
  // 3. NOTIFICATION & PERFORMANCE TEST SUITE (Phase 1C & 1D)
  // -------------------------------------------------------------
  console.log("\n--- 3. NOTIFICATION & PERFORMANCE TESTS ---");

  // 3.1 Web Push VAPID Public Key API
  try {
    const res = await fetch(`${BASE_URL}/notifications/vapid-key`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (res.ok && data.publicKey) {
      logTest("Notification & Performance", "Fetch VAPID Public Key", true);
    } else {
      logTest("Notification & Performance", "Fetch VAPID Public Key", false, data.message);
    }
  } catch (err) {
    logTest("Notification & Performance", "Fetch VAPID Public Key", false, err.message);
  }

  // 3.2 Update Notification Preferences
  try {
    const res = await fetch(`${BASE_URL}/notifications/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      logTest("Notification & Performance", "Update User Notification Preferences", true);
    } else {
      logTest("Notification & Performance", "Update User Notification Preferences", false, data.message);
    }
  } catch (err) {
    logTest("Notification & Performance", "Update User Notification Preferences", false, err.message);
  }

  // 3.3 Cursor-based Pagination API Test
  try {
    const res = await fetch(`${BASE_URL}/conversations`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.conversations || data)) {
      logTest("Notification & Performance", "Cursor-Based Conversation Pagination API", true);
    } else {
      logTest("Notification & Performance", "Cursor-Based Conversation Pagination API", false, data.message);
    }
  } catch (err) {
    logTest("Notification & Performance", "Cursor-Based Conversation Pagination API", false, err.message);
  }

  // -------------------------------------------------------------
  // 4. GROUP CHAT & RICH MEDIA TEST SUITE (Phase 2A & 2B)
  // -------------------------------------------------------------
  console.log("\n--- 4. GROUP CHAT & RICH MEDIA TESTS ---");

  let createdGroupId = null;

  // 4.1 Group Creation
  try {
    // Create secondary member user for group
    const friendUsername = `frienduser_${Date.now()}`;
    const friendRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: friendUsername,
        email: `${friendUsername}@example.com`,
        password: testPassword,
        displayName: "Friend Test User",
      }),
    });
    
    // Login friend to get ID & Token
    const friendLoginRes = await fetch(`${BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: friendUsername,
        password: testPassword,
      }),
    });
    const friendData = await friendLoginRes.json();
    const friendUserId = friendData.user?.id || friendData.user?._id;
    const friendToken = friendData.accessToken;

    // Send friend request from friendUser to testUser
    const reqRes = await fetch(`${BASE_URL}/friends/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${friendToken}`,
      },
      body: JSON.stringify({ to: testUserId, message: "Add friend for test" }),
    });
    const reqData = await reqRes.json();
    const requestId = reqData.request?._id;

    // Accept friend request by testUser
    if (requestId) {
      await fetch(`${BASE_URL}/friends/requests/${requestId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
        },
      });
    }

    const res = await fetch(`${BASE_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        type: "group",
        name: "Automated Test Group",
        memberIds: [friendUserId],
      }),
    });
    const data = await res.json();
    if (res.ok && (data.conversation || data._id)) {
      createdGroupId = (data.conversation || data)._id;
      logTest("Group & Rich Media", "Create Advanced Group Chat", true, `GroupId: ${createdGroupId}`);
    } else {
      logTest("Group & Rich Media", "Create Advanced Group Chat", false, data.message);
    }
  } catch (err) {
    logTest("Group & Rich Media", "Create Advanced Group Chat", false, err.message);
  }

  // 4.2 Group Poll Creation
  if (createdGroupId) {
    try {
      const res = await fetch(`${BASE_URL}/conversations/${createdGroupId}/polls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          question: "Bạn thấy hệ thống Kyeto Chat thế nào?",
          options: ["Tuyệt vời!", "Rất tốt", "Cần cải thiện"],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        logTest("Group & Rich Media", "Create In-Group Interactive Poll", true);
      } else {
        logTest("Group & Rich Media", "Create In-Group Interactive Poll", false, data.message);
      }
    } catch (err) {
      logTest("Group & Rich Media", "Create In-Group Interactive Poll", false, err.message);
    }
  }

  // 4.3 Link Preview OpenGraph Endpoint
  try {
    const res = await fetch(`${BASE_URL}/messages/link-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ url: "https://github.com" }),
    });
    const data = await res.json();
    if (res.ok && data.preview !== undefined) {
      logTest("Group & Rich Media", "OpenGraph Link Preview Extraction", true);
    } else {
      logTest("Group & Rich Media", "OpenGraph Link Preview Extraction", false, data.message);
    }
  } catch (err) {
    logTest("Group & Rich Media", "OpenGraph Link Preview Extraction", false, err.message);
  }

  // -------------------------------------------------------------
  // 5. MESSAGE MANAGEMENT, UX & AI TEST SUITE (Phase 2D & 3A)
  // -------------------------------------------------------------
  console.log("\n--- 5. MESSAGE MANAGEMENT, UX & AI TESTS ---");

  // 5.1 AI Chat Direct Response API
  try {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ prompt: "Chào trợ lý AI Kyeto Chat, hãy giới thiệu ngắn gọn." }),
    });
    const data = await res.json();
    if (res.ok && (data.reply || data.response)) {
      logTest("AI Integration", "AI Assistant Response (@ai handler)", true);
    } else {
      logTest("AI Integration", "AI Assistant Response (@ai handler)", false, data.message);
    }
  } catch (err) {
    logTest("AI Integration", "AI Assistant Response (@ai handler)", false, err.message);
  }

  // 5.2 AI Smart Translation API
  try {
    const res = await fetch(`${BASE_URL}/ai/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        text: "Hello, welcome to Kyeto Chat Platform!",
        targetLanguage: "vi",
      }),
    });
    const data = await res.json();
    if (res.ok && data.translatedText) {
      logTest("AI Integration", "AI Instant Text Translation API", true, `Dịch: "${data.translatedText}"`);
    } else {
      logTest("AI Integration", "AI Instant Text Translation API", false, data.message);
    }
  } catch (err) {
    logTest("AI Integration", "AI Instant Text Translation API", false, err.message);
  }

  // 5.3 AI Smart Conversation Summary API
  try {
    const res = await fetch(`${BASE_URL}/ai/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        messages: [
          { senderName: "Alice", content: "Chào mọi người, chúng ta họp lúc 9h sáng mai nhé." },
          { senderName: "Bob", content: "Đồng ý, tôi sẽ chuẩn bị tài liệu báo cáo." },
        ],
      }),
    });
    const data = await res.json();
    if (res.ok && data.summary) {
      logTest("AI Integration", "AI Conversation Summarization API", true);
    } else {
      logTest("AI Integration", "AI Conversation Summarization API", false, data.message);
    }
  } catch (err) {
    logTest("AI Integration", "AI Conversation Summarization API", false, err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n=======================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  if (failed > 0) console.log(`⚠️ FAILED TESTS: ${failed}`);
  console.log("=======================================================\n");
}

runSuite();
