
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import axios from 'axios';
import React, { useState } from 'react'

axios.create({
    baseURL: 'https://localhost:4000/v1/',
    timeout: 10000,
    withCredentials: true,
  });

const CARD_OPTIONS = {
	iconStyle: "solid",
	style: {
		base: {
			iconColor: "#c4f0ff",
			color: "#fff",
			fontWeight: 500,
			fontFamily: "Roboto, Open Sans, Segoe UI, sans-serif",
			fontSize: "16px",
			fontSmoothing: "antialiased",
			":-webkit-autofill": { color: "#fce883" },
			"::placeholder": { color: "#87bbfd" }
		},
		invalid: {
			iconColor: "#ffc7ee",
			color: "#ffc7ee"
		}
	}
}

export default function PaymentForm() {
    const [success ] = useState(false)
    const stripe = useStripe()
    const elements = useElements()


    const handleSubmit = async (e) => {



        e.preventDefault()

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
          }

          const options = {
            mode: 'cors',
            withCredentials: true, // normalement plus besoin car mis dans le fichier de configuration
            headers: {'x-xsrf-token':"9dfe68ed5174119fa30bc7fb2e69a97d2c14f4b45d8859759f8db54ea1acf5855ccb2624e47f7fcdb69f9d9e7791d2e94fae73caeb00f204ed8b81c75bcaba299e3296170c7f" },
          };


    const clientSecret = await axios.get("https://localhost:4000/v1/user/paiementkey", options );

       
        console.log(clientSecret.data.client_secret);
        console.log(elements.getElement(CardElement));

        const result = await stripe.confirmCardPayment(clientSecret.data.client_secret, {
            payment_method: {
                card: elements.getElement(CardElement),
              }
        });


        if (result.error) {
            // Show error to your customer (e.g., insufficient funds)
            console.log(result.error.message);
          } else {
            // The payment has been processed!
            if (result.paymentIntent.status === 'succeeded') {
              // Show a success message to your customer
              // There's a risk of the customer closing the window before callback
              // execution. Set up a webhook or plugin to listen for the
              // payment_intent.succeeded event that handles any business critical
              // post-payment actions.
            }
          }
        };


    return (
        <div>
        {!success ? 
        <form onSubmit={handleSubmit}>
            <fieldset className="FormGroup">
                <div className="FormRow">
                    <CardElement options={CARD_OPTIONS}/>
                </div>
            </fieldset>
            <button>Pay</button>
        </form>
        :
       <div>
           <h2>Bravo, vous venez d'achetez un produit sur MadaShop</h2>
       </div> 
        }
            
        </div>
    )

}