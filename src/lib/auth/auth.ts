import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";

export async function getSession() {
  const token = cookies().get(process.env.COOKIE_NAME!);

  if (!token) {
    return null;
  }

  try {
    const session = await decrypt(token.value);
    return session;
  } catch (error) {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  return session;
}

export async function requireGuest() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }
}
