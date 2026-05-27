# OAuth Social Login

Darkside.cool mantiene autenticacion propia con JWT. Google y Facebook solo crean o vinculan usuarios usando correo verificado; no reemplazan el login local ni asignan roles administrativos.

## Variables Backend

Configurar solo en el backend/API:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.darkside.cool/api/auth/oauth/google/callback

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_CALLBACK_URL=https://api.darkside.cool/api/auth/oauth/facebook/callback

OAUTH_STATE_SECRET=
FRONTEND_URL=https://darkside.cool
```

No usar `NEXT_PUBLIC_` para secretos.

## Google Cloud Console

- Crear OAuth Client tipo `Web application`.
- Authorized JavaScript origins: `https://darkside.cool`.
- Authorized redirect URI: `https://api.darkside.cool/api/auth/oauth/google/callback`.
- Scopes usados: `openid email profile`.

## Meta Developers

- Crear app y activar Facebook Login for Web.
- App domain: `darkside.cool`.
- Valid OAuth Redirect URI: `https://api.darkside.cool/api/auth/oauth/facebook/callback`.
- Scopes usados: `email public_profile`.
- Configurar URLs publicas de privacidad y terminos antes de pasar a modo live.

## Flujo

1. Usuario pulsa `Continuar con Google` o `Continuar con Facebook`.
2. Backend genera `state` firmado y redirige al proveedor.
3. Proveedor devuelve `code` al callback backend.
4. Backend obtiene perfil minimo y exige correo verificado.
5. Si el usuario existe por provider, inicia sesion.
6. Si el correo verificado ya existe, vincula provider a ese usuario.
7. Si no existe, crea usuario `USER`, wallet con `100 TOKENS` y audita el registro.
8. Frontend recibe payload en `/auth/oauth/callback`, guarda sesion local y abre `/dashboard`.

## Seguridad

- No se guardan ni imprimen access tokens de proveedores.
- No se exponen client secrets al frontend.
- Usuarios `SUSPENDED` no pueden iniciar sesion por OAuth.
- OAuth nunca crea `ADMIN` ni `SUPER_ADMIN`.
- Las cuentas sociales conectadas se ven en `/dashboard/account`.
