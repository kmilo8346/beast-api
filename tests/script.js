import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '300s',
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
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyODA5ZGQyMzlkMjRiZDM3OWMwYWQxOTFmOGIwZWRjZGI5ZDM5MTQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYmVhc3QtZGV2ZWxvcG1lbnQiLCJhdWQiOiJiZWFzdC1kZXZlbG9wbWVudCIsImF1dGhfdGltZSI6MTU5ODQ1MTk2OCwidXNlcl9pZCI6IkpxQnNrdVBvWjZZR3Z1Z3owWE11WElRbEg5ODMiLCJzdWIiOiJKcUJza3VQb1o2WUd2dWd6MFhNdVhJUWxIOTgzIiwiaWF0IjoxNTk4NDUxOTY4LCJleHAiOjE1OTg0NTU1NjgsImVtYWlsIjoiZmlyZWRldnMudGVhbUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiZmlyZWRldnMudGVhbUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.sEXSFESuogIv1LDued62GI3YNVz7563rzIfyYeTDx0Abs1nPUkqzqondFkijm1TOHnUVK20bRnJ-OYsxjfb7028JV9WQ3rek6ufwPF_H0fFENxBG7_6BYT8_DmRBSLdkaGahR9tcaU1Yo-hJZsCLXwT_lyfkS9FpF2nCeL8aaaHXgnyR_N1sQ-ZfardqTtw2O00owDCoLdz7TYx1b2gfVkI4yh8zmvMDK_LFE9WwVWiMLTsWpbesXmuQisfaXpjZKv52wR4iAiUe0AuJC54kcpPQABk8dq_-emm265YbmCs94-XxTuStipCaQSc4m751Tpf2oXsJgwPki9mrWceIhw',
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
