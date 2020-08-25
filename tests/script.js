import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const url =
    'http://localhost:3000/stores/stores|Qfe0CHQBtLDX3pAT6hAe/products';
  const payload = JSON.stringify({
    body: {
      name: `Producto ${new Date().getTime()}`,
      description: 'Buen producto',
      images: [
        'https://firebasestorage.googleapis.com/v0/b/beast-development.appspot.com/o/stores%2Fby9v-wxjktsp065eh35q%2Fproducts%2Fimages%2Fby9v1oq1ks_bel-5v0d3.jpg?alt=media&token=f7f50211-0fca-40a9-8f01-8ca7924a2128',
      ],
      price: 1000,
      tags: ['THAI'],
      enabled: true,
    },
  });

  const params = {
    headers: {
      Authorization:
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyODA5ZGQyMzlkMjRiZDM3OWMwYWQxOTFmOGIwZWRjZGI5ZDM5MTQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYmVhc3QtZGV2ZWxvcG1lbnQiLCJhdWQiOiJiZWFzdC1kZXZlbG9wbWVudCIsImF1dGhfdGltZSI6MTU5ODM3MDg2MCwidXNlcl9pZCI6IkpxQnNrdVBvWjZZR3Z1Z3owWE11WElRbEg5ODMiLCJzdWIiOiJKcUJza3VQb1o2WUd2dWd6MFhNdVhJUWxIOTgzIiwiaWF0IjoxNTk4MzcwODYwLCJleHAiOjE1OTgzNzQ0NjAsImVtYWlsIjoiZmlyZWRldnMudGVhbUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiZmlyZWRldnMudGVhbUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.FikjCeBTMb_hXB8ZcMzN43dbZmhtJKke_u2pupjzZT2hqtIZKlYKAzbZ6LLZrB5pAg-3F9nNhis_s10kSjV-qjo5f3kSQC17bl49qWJiN5pBvEEwuY9ZaJq3WvGabX3015rcb4bvzaH3uQ2-8Mz0oeuTzB7wXFR00ghO-qXAvYacUeLR0rxGASN8FSVGEBK7AHuno8JvfPraOkT0GFPlRHFS4Eh103_GBwaKlZVpul-hloCfC5VWM-ILZFTsJE6tSvxMtnSNM8u-amdQcLohhB9TztGcI3QaCGOK4hCyKL-qr-VQFEF7g07vYJxdYHGW5vP9epN_1v1U2KD06KKj5Q',
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
