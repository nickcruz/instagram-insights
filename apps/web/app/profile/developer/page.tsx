import { redirect } from "next/navigation";
export default function DeveloperAccessPage() {
  redirect("/developers?legacy=developer-access");
}
