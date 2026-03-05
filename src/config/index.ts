export const config = {
  appName: "UDIScheduler",
  validDomain: "udi.edu.co",
  errors: {
    unauthorized: {
      code: "unauthorized",
      message: "No estás autorizado para realizar esta acción.",
    },
    notFound: {
      code: "not_found",
      message: "No se encontró el recurso.",
    },
    invalidEmail: {
      code: "invalid_email",
      message:
        "El correo electrónico no hace parte del dominio de la institución.",
    },
    overlaps: {
      code: "overlaps",
      message: "Ya hay una reserva para este laboratorio en el mismo horario.",
    },
  },
};
