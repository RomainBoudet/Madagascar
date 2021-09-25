import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import PaymentForm from "./PaymentForm"

//const PUBLIC_KEY = process.env.PUBLIC_KEY;

const stripeTestPromise = loadStripe("pk_test_51INjC0LNa9FFzz1XcfOp22HlwqW9v4uyCjlBGRwbUol6NCxLqP9XCJQlmNmhbOVNXXN2p9nej72rURv0nt69DRJD00ilB3qo57")

export default function StripeContainer() {
	return (
		<Elements stripe={stripeTestPromise}>
			<PaymentForm />
		</Elements>
	)
}