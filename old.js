import express from 'express';
import bodyParser from 'body-parser';
import { generateEncryptedString } from 'crypto';

const app = express();

app.use(bodyParser.json());

app.post('/nuevaventa', async (req, res) => {
  const {
    terminal,
    tipoPlan,
    importe,
    status,
    aprobacion,
    tarjeta,
    nombre,
    concepto,
    referencia,
    referencia2,
    correo,
    folio,
    parcializacion,
    diferimento,
    fecha,
    statusComentario,
    causaDenegada,
    descripcion,
    corte,
    terminalPuente,
  } = req.body;

  // Genera la cadena encriptada
  const cadenaEncriptada = await generateEncryptedString({
    terminal,
    tipoPlan,
    importe,
    status,
    aprobacion,
    tarjeta,
    nombre,
    concepto,
    referencia,
    referencia2,
    correo,
    folio,
    parcializacion,
    diferimento,
    fecha,
    statusComentario,
    causaDenegada,
    descripcion,
    corte,
    terminalPuente,
  });

  // Realiza la solicitud POST
  const response = await fetch(
    'http://166.62.55.208/v2/nuevaventa.ashx',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        terminal,
        tipoPlan,
        importe,
        status,
        aprobacion,
        tarjeta,
        nombre,
        concepto,
        referencia,
        referencia2,
        correo,
        folio,
        parcializacion,
        diferimento,
        fecha,
        statusComentario,
        causaDenegada,
        descripcion,
        corte,
        terminalPuente,
        cadenaEncriptada,
      }),
    },
  );

  // Procesa la respuesta
  if (response.status === 200) {
    const data = await response.json();
    res.status(200).json(data);
  } else {
    res.status(response.status).send('Error');
  }
});

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});