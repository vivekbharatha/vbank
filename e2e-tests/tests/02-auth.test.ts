import {
  apiGateway,
  registerUser,
  loginUser,
  testState,
  getTestUser,
} from "./utils";

describe("Auth Service Tests", () => {
  test("User registration should return 201 Created", async () => {
    testState.currentTestUser = getTestUser();
    const response = await registerUser(testState.currentTestUser);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(testState.currentTestUser.email);
  });

  test("Registration with existing email should return 400", async () => {
    const response = await registerUser(testState.currentTestUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("email already in use");
  });

  test("User login should return 200 OK and a token", async () => {
    const response = await loginUser({
      email: testState.currentTestUser.email,
      password: testState.currentTestUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
    expect(response.body.token).not.toBe("");

    expect(testState.authToken).not.toBe("");
  });

  test("Login with invalid credentials should return 401 Unauthorized", async () => {
    const response = await apiGateway().post("/api/v1/auth/login").send({
      email: testState.currentTestUser.email,
      password: "wrongPassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("invalid credentials");
  });

  test("User logout should return 200 OK", async () => {
    const response = await apiGateway()
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("logged out successfully");
    testState.authToken = "";
  });
});
