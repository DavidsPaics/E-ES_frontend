export function fakeLogin(username: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (username === "a" && password === "b") {
      const fakeToken = btoa(JSON.stringify({ username, exp: Date.now() + 60 * 60 * 1000 }));
      resolve(fakeToken);
    } else {
      reject("Invalid credentials");
    }
  });
}

export function fakeVerify(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
