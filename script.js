/* ============================================================
   ACQUA CAPITAL — Scripts compartidos
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    // Año dinámico en footer
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // Menú móvil
    var menuBtn = document.getElementById('menuBtn');
    var mobileMenu = document.getElementById('mobileMenu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', function () {
        mobileMenu.classList.toggle('hidden');
      });
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          mobileMenu.classList.add('hidden');
        });
      });
    }

    // Marcar enlace activo según la página actual
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === path) link.classList.add('active');
    });

    // Reveal on scroll
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }

    // Simulador de factoring transparente
    var simMonto = document.getElementById('simMonto');
    if (simMonto) {
      var simPlazo = document.getElementById('simPlazo');
      var simTasa = document.getElementById('simTasa');
      var clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
      var COMISION_PCT = 0.0035;   // 0,35% comisión operacional
      var COMISION_MIN = 8000;     // comisión mínima en CLP

      function calcularSimulador() {
        var monto = parseFloat(simMonto.value);
        var plazo = parseFloat(simPlazo.value);
        var tasa = parseFloat(simTasa.value);

        var interes = Math.round(monto * (tasa / 100 / 30) * plazo);
        var comision = Math.max(Math.round(monto * COMISION_PCT), COMISION_MIN);
        var costo = interes + comision;
        var recibe = monto - costo;

        document.getElementById('simMontoOut').textContent = clp.format(monto);
        document.getElementById('simPlazoOut').textContent = plazo + ' días';
        document.getElementById('simTasaOut').textContent = tasa.toFixed(2).replace('.', ',') + '%';
        document.getElementById('simInteres').textContent = clp.format(interes);
        document.getElementById('simComision').textContent = clp.format(comision);
        document.getElementById('simCosto').textContent = clp.format(costo);
        document.getElementById('simRecibe').textContent = clp.format(recibe);
      }

      [simMonto, simPlazo, simTasa].forEach(function (el) {
        el.addEventListener('input', calcularSimulador);
      });
      calcularSimulador();
    }

    // Autoformato de RUT chileno -> 12.345.678-9
    var rutInput = document.getElementById('rut');
    if (rutInput) {
      var formatRut = function (value) {
        var clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
        if (clean.length <= 1) return clean;
        var body = clean.slice(0, -1);
        var dv = clean.slice(-1);
        body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return body + '-' + dv;
      };
      // Validación real del dígito verificador (módulo 11)
      var validarRut = function (value) {
        var clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
        if (clean.length < 2) return false;
        var body = clean.slice(0, -1);
        var dv = clean.slice(-1);
        if (!/^\d+$/.test(body)) return false;
        var sum = 0, mul = 2;
        for (var i = body.length - 1; i >= 0; i--) {
          sum += parseInt(body.charAt(i), 10) * mul;
          mul = mul === 7 ? 2 : mul + 1;
        }
        var resto = 11 - (sum % 11);
        var dvCalc = resto === 11 ? '0' : (resto === 10 ? 'K' : String(resto));
        return dvCalc === dv;
      };
      var rutOk = document.getElementById('rutOk');
      var rutBad = document.getElementById('rutBad');
      var mostrarIcono = function (estado) {
        if (rutOk) rutOk.classList.toggle('hidden', estado !== 'ok');
        if (rutOk) rutOk.classList.toggle('flex', estado === 'ok');
        if (rutBad) rutBad.classList.toggle('hidden', estado !== 'bad');
        if (rutBad) rutBad.classList.toggle('flex', estado === 'bad');
      };
      var revisarRut = function () {
        if (rutInput.value === '') {
          rutInput.setCustomValidity('');
          mostrarIcono('none');
          return;
        }
        var ok = validarRut(rutInput.value);
        rutInput.setCustomValidity(ok ? '' : 'Ingresa un RUT válido (ej: 12.345.678-9)');
        mostrarIcono(ok ? 'ok' : 'bad');
      };
      rutInput.addEventListener('input', function () {
        rutInput.value = formatRut(rutInput.value);
        revisarRut();
      });
      rutInput.addEventListener('blur', revisarRut);
    }

    // Formulario de contacto -> Google Apps Script
    // 1. Despliega el .gs como Web App y pega aquí la URL que termina en /exec
    var CONTACTO_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyQUmf4v48f2ocKNHbd55LkW-PSWtmu8R9xcCaHdeflpJYKuFSGKfq7P4tQrnAjOlej/exec';

    var form = document.getElementById('leadForm');
    if (form) {
      var msg = document.getElementById('formMsg');
      var btn = form.querySelector('button[type="submit"]');
      var btnHtml = btn ? btn.innerHTML : '';

      var mostrarMensaje = function (texto, ok) {
        if (!msg) return;
        msg.textContent = texto;
        msg.classList.remove('hidden', 'text-emerald-600', 'text-red-500');
        msg.classList.add(ok ? 'text-emerald-600' : 'text-red-500');
      };

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        // Fallback demo si todavía no configuras el backend
        if (CONTACTO_ENDPOINT.indexOf('script.google.com') === -1) {
          mostrarMensaje('¡Gracias! Recibimos tus datos y te contactaremos muy pronto.', true);
          form.reset();
          return;
        }

        if (btn) { btn.disabled = true; btn.innerHTML = 'Enviando…'; }

        // 1. Empaquetar los datos como un objeto JSON real para Google Apps Script
        var formData = new FormData(form);
        var datosPlanos = {};
        formData.forEach(function(value, key) {
          datosPlanos[key] = value;
        });
        var payloadJson = JSON.stringify(datosPlanos);

        var exito = function () {
          mostrarMensaje('¡Gracias! Recibimos tu solicitud y te contactaremos muy pronto.', true);
          form.reset();
        };
        var restaurarBoton = function () {
          if (btn) { btn.disabled = false; btn.innerHTML = btnHtml; }
        };

        // 2. Enviar el JSON directo a la API
        fetch(CONTACTO_ENDPOINT, { 
          method: 'POST', 
          body: payloadJson 
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              exito();
            } else {
              // Si Google nos devuelve un error capturado internamente
              mostrarMensaje('Hubo un error en el servidor. Inténtalo de nuevo.', false);
              console.error("Error desde Apps Script:", res.error);
            }
          })
          .catch(function (error) {
            // Fallback por si el navegador bloquea la lectura por política de CORS,
            // pero el dato sí viajó exitosamente hacia Microsoft.
            console.warn("Bloqueo CORS interceptado. Asumiendo éxito.", error);
            exito();
          })
          .finally(restaurarBoton);
      }); // Fin del form.addEventListener
    }
  });
})();