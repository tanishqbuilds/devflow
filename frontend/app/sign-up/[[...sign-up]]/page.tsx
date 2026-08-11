import {SignUp} from '@clerk/nextjs'
export default function SignUpPage(){return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/my-projects"/></main>}
