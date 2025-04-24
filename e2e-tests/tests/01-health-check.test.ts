import { accountService, apiGateway, authService } from "./utils";

describe("Health Check Tests", () => {
  test("API Gateway health check should return 200 OK", async () => {
    const response = await apiGateway().get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });

  test("Auth Service health check should return 200 OK", async () => {
    const response = await authService().get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });

  test("Account Service health check should return 200 OK", async () => {
    const response = await accountService().get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });
});
