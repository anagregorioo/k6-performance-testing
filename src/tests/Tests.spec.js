import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas solicitadas
let gestTrend = new Trend('gest_duration');
let statusRate = new Rate('status_ok');
let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '10s', target: 7 },      // começa em 7 VUs
    { duration: '200s', target: 92 },    // rampa até 92 VUs (3,5 minutos total)
  ],
  thresholds: {
    'http_req_duration': ['p(90) < 6800'], // 90% abaixo de 6800ms
    'gest_duration': ['p(90) < 6800'],     // trend validando duração
    'errors': ['rate<0.25'],               // menos de 25% erros
    'status_ok': ['rate>0.75'],            // pelo menos 75% OK
  },
};

export default function () {

  const url = 'https://jsonplaceholder.typicode.com/posts';

  const res = http.get(url, { tags: { name: 'gest' } });

  // Métricas customizadas
  gestTrend.add(res.timings.duration);
  statusRate.add(res.status >= 200 && res.status < 400);
  errorRate.add(res.status >= 400);

  // Validação
  check(res, {
    'status OK (2xx/3xx)': r => r.status >= 200 && r.status < 400,
  });

  sleep(1);
}
