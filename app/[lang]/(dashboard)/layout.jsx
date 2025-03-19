import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";
import { getDictionary } from "@/app/dictionaries";
import { cookies } from 'next/headers'; // Import cookies
import { redirect } from "next/navigation";
import jwt from 'jsonwebtoken'; // Import JWT

const layout = async ({ children, params: { lang } }) => {
  // Check for JWT cookie
  const token = cookies().get('token')?.value; // Get the cookie value
// console.log(token,"token");

  if (!token) {
    redirect("/"); // Redirect to login if no token
  }
  try {
    // Verify the JWT (optional but recommended)
    jwt.verify(token, process.env.JWT_SECRET); // Verify the token

    // If verification fails, the catch block will handle the redirect
  } catch (error) {
    console.error("Token verification failed:", error);
    redirect("/"); // Redirect to login if token is invalid
  }

  const trans = await getDictionary(lang);
const user={
  name:"adf",
  id:13
}
  return (
    <DashBoardLayoutProvider   trans={trans}>{children}</DashBoardLayoutProvider>
  );
};

export default layout;