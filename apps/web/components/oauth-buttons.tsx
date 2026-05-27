"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/config";

type Providers = {
  google: boolean;
  facebook: boolean;
};

const defaultProviders: Providers = {
  google: true,
  facebook: true
};

export function OAuthButtons() {
  const [providers, setProviders] = useState<Providers>(defaultProviders);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`${apiUrl}/auth/oauth/providers`)
      .then((response) => (response.ok ? response.json() : defaultProviders))
      .then((data: Providers) => {
        if (active) {
          setProviders(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const anyProvider = useMemo(() => providers.google || providers.facebook, [providers]);

  function start(provider: "google" | "facebook") {
    window.location.href = `${apiUrl}/auth/oauth/${provider}`;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="btn-secondary !justify-center !px-4 !py-3 !text-xs"
          disabled={loaded && !providers.google}
          onClick={() => start("google")}
        >
          Continuar con Google
        </button>
        <button
          type="button"
          className="btn-secondary !justify-center !px-4 !py-3 !text-xs"
          disabled={loaded && !providers.facebook}
          onClick={() => start("facebook")}
        >
          Continuar con Facebook
        </button>
      </div>
      {loaded && !anyProvider ? (
        <p className="text-xs leading-5 text-white/55">
          El acceso social esta pendiente de configurar en el servidor.
        </p>
      ) : (
        <p className="text-xs leading-5 text-white/55">
          Usaremos solo tu correo verificado del proveedor. Tu Riot ID se vincula por separado.
        </p>
      )}
    </div>
  );
}
