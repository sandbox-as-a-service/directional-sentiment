"use server"

import {revalidatePath} from "next/cache"
import {redirect} from "next/navigation"

import {createSupabaseServerClient} from "@/app/(adapters)/(out)/supabase/server"

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const body = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const {error} = await supabase.auth.signInWithPassword(body)

  if (error) {
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}
