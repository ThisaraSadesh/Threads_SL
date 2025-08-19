// Simple test script to verify webhook endpoint
const testWebhook = async () => {
  try {
    const response = await fetch("http://localhost:3001/api/webhook/clerk", {
      method: "GET", // Test if the endpoint accepts GET first
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("GET Status:", response.status);
    console.log("GET Response:", await response.text());

    // Now test POST
    const postResponse = await fetch(
      "http://localhost:3001/api/webhook/clerk",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
        }),
      }
    );

    console.log("POST Status:", postResponse.status);
    console.log("POST Response:", await postResponse.text());
  } catch (error) {
    console.error("Error:", error);
  }
};

testWebhook();
