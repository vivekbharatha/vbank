import request from "supertest";
import { config } from "./config";
import { AccountType, UserType } from "./type";

export const getTestUser = (): UserType => ({
  firstName: "Test",
  lastName: "User",
  email: `test-${Date.now()}@swevivekbharatha.com`,
  password: `test-${Date.now()}Password123!`,
});

export const testState = {
  authToken: "",
  userId: "",
  currentTestUser: getTestUser(),
  accounts: [] as AccountType[],
};

export const cleanUpTestState = () => {
  testState.authToken = "";
  testState.userId = "";
  testState.currentTestUser = getTestUser();
  testState.accounts = [];
};

export const apiGateway = () => request(config.apiGatewayUrl);
export const authService = () => request(config.authServiceUrl);
export const accountService = () => request(config.accountServiceUrl);

export async function registerUser(user: UserType) {
  const response = await apiGateway().post("/api/v1/auth/register").send(user);

  return response;
}

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const response = await apiGateway().post("/api/v1/auth/login").send({
    email,
    password,
  });

  if (response.status === 200 && response.body.token) {
    testState.authToken = response.body.token;
  }

  return response;
}

export function authenticatedRequest() {
  return apiGateway().set("Authorization", `Bearer ${testState.authToken}`);
}

export async function cleanupResources() {
  for (const account of testState.accounts) {
    try {
      await apiGateway()
        .delete(`/api/v1/accounts/${account.accountNumber}`)
        .set("Authorization", `Bearer ${testState.authToken}`);
    } catch (error) {
      console.error(
        `Failed to delete account ${account.accountNumber}:`,
        error
      );
    }
  }
}
