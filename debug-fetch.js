require("dotenv").config(); const fetch = require("node-fetch"); (async () => { try { const response = await fetch(`http://${process.env.DEVELOPER_IP}:${process.env.PORT}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "tjpheno@gmail.com", password: "password123" }) }); const data = await response.json(); console.log("Token:", data.token); const userResponse = await fetch(`http://${process.env.DEVELOPER_IP}:${process.env.PORT}/api/auth/me`, { headers: { Authorization: `Bearer ${data.token}` } }); const userData = await userResponse.json(); console.log("User data:", userData); } catch (error) { console.error("Error:", error); } })();
