import { showAlert } from './alert';

/* eslint-disable */
const stripe = Stripe(
  'pk_test_51NvgE6SAirumL6rPhZiWyGklJWAj6C2CqZp7gYZYTbKTuFmXc1R32JqHTHypkOklG24RLVc93Kda4VtpbuOkq3ch00IoTKYUqb',
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios(
      // `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`,
      `/api/v1/booking/checkout-session/${tourId}`,
    );
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err.message);
  }
};
