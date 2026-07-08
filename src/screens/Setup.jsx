import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useLongPress } from '../hooks/useLongPress';
import { saveCategories, DEFAULT_CATEGORIES } from '../services/categories';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Clock, 
  ChevronLeft, 
  Plus, 
  X, 
  Trash2, 
  RotateCcw, 
  Edit3, 
  Check,
  Play,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export default function Setup() {
  const { 
    todasCategorias, 
    config, 
    setConfig, 
    jugadores, 
    setJugadores, 
    iniciarNuevaPartida,
    recargarCategorias,
    navegarA 
  } = useGame();

  // Estados locales para el formulario de configuración
  const [nombreJugador, setNombreJugador] = useState("");
  const [rondasLocales, setRondasLocales] = useState(config.rondas);
  const [esInfinito, setEsInfinito] = useState(config.rondas === 'infinito');
  const [tiempoLocal, setTiempoLocal] = useState(config.tiempo);
  const [llevarPuntajeLocal, setLlevarPuntajeLocal] = useState(config.llevarPuntaje);
  const [categoriasActivasLocales, setCategoriasActivasLocales] = useState(config.categoriasActivas);

  // Estados para alertas y notificaciones en UI (adiós alert nativo)
  const [notificacionError, setNotificacionError] = useState("");

  // Estados para modales de edición
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [modalNuevaCatOpen, setModalNuevaCatOpen] = useState(false);
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState(null); // objeto categoría completo
  const [nuevaPalabra, setNuevaPalabra] = useState("");

  // Estado para modal de confirmación de eliminación (adiós confirm nativo)
  const [confirmarEliminarCat, setConfirmarEliminarCat] = useState(null); // guarda la categoría a eliminar

  // Limpiar notificaciones automáticamente después de 3 segundos
  useEffect(() => {
    if (notificacionError) {
      const timer = setTimeout(() => setNotificacionError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacionError]);

  // Sincronizar categorías del contexto si cambian externamente
  useEffect(() => {
    if (categoriasActivasLocales.length === 0 && todasCategorias.length > 0) {
      setCategoriasActivasLocales(todasCategorias.map(c => c.id));
    }
  }, [todasCategorias]);

  // Lanzar notificación de error interna en la UI
  const lanzarError = (msg) => {
    setNotificacionError(msg);
  };

  // --- Gestión de Jugadores ---
  const capitalizarNombre = (str) => {
    return str
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  };

  const handleAgregarJugador = (e) => {
    e.preventDefault();
    if (!nombreJugador.trim()) return;
    const nombreClean = capitalizarNombre(nombreJugador.trim());
    
    if (jugadores.includes(nombreClean)) {
      lanzarError("Ese jugador ya está en la lista.");
      return;
    }
    if (jugadores.length >= 10) {
      lanzarError("Límite máximo de 10 jugadores alcanzado.");
      return;
    }
    
    setJugadores(prev => [...prev, nombreClean]);
    setNombreJugador("");
  };

  const handleEliminarJugador = (nombre) => {
    setJugadores(prev => prev.filter(j => j !== nombre));
  };

  // --- Gestión de Rondas y Tiempo ---
  const handleRondaChange = (incremento) => {
    if (esInfinito) return;
    setRondasLocales(prev => {
      const val = prev + incremento;
      return val >= 1 && val <= 10 ? val : prev;
    });
  };

  const handleTiempoChange = (incremento) => {
    setTiempoLocal(prev => {
      const val = prev + incremento;
      return val >= 30 && val <= 180 ? val : prev;
    });
  };

  const handleTiempoBlur = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 75;
    if (val < 30) val = 30;
    if (val > 180) val = 180;
    setTiempoLocal(val);
  };

  // --- Gestión de Categorías Activas ---
  const toggleCategoria = (id) => {
    setCategoriasActivasLocales(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          lanzarError("Debe haber al menos 1 categoría activa.");
          return prev;
        }
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // --- Modal: Crear Nueva Categoría Propia ---
  const handleCrearCategoriaPropia = (e) => {
    e.preventDefault();
    const nombreClean = nuevaCatNombre.trim();
    if (!nombreClean) return;
    
    if (todasCategorias.some(c => c.nombre.toLowerCase() === nombreClean.toLowerCase())) {
      lanzarError("Esta categoría ya existe.");
      return;
    }

    const nuevaCat = {
      id: `own-${Date.now()}`,
      nombre: nombreClean,
      palabras: [],
      esPropia: true
    };

    const actualizadas = [...todasCategorias, nuevaCat];
    saveCategories(actualizadas);
    recargarCategorias();
    
    setCategoriasActivasLocales(prev => [...prev, nuevaCat.id]);
    setNuevaCatNombre("");
    setModalNuevaCatOpen(false);
  };

  // --- Modal: Edición de Palabras (Long Press) ---
  const abrirEditorCategoria = (categoria) => {
    setCategoriaEnEdicion(JSON.parse(JSON.stringify(categoria)));
    setNuevaPalabra("");
  };

  const handleAgregarPalabra = (e) => {
    e.preventDefault();
    const palClean = nuevaPalabra.trim();
    if (!palClean) return;
    
    if (categoriaEnEdicion.palabras.some(p => p.toLowerCase() === palClean.toLowerCase())) {
      lanzarError("Esta palabra ya existe en la categoría.");
      return;
    }

    setCategoriaEnEdicion(prev => ({
      ...prev,
      palabras: [...prev.palabras, palClean]
    }));
    setNuevaPalabra("");
  };

  const handleEliminarPalabra = (palabra) => {
    setCategoriaEnEdicion(prev => ({
      ...prev,
      palabras: prev.palabras.filter(p => p !== palabra)
    }));
  };

  const handleRestaurarDefecto = () => {
    const original = DEFAULT_CATEGORIES.find(c => c.id === categoriaEnEdicion.id);
    if (original) {
      setCategoriaEnEdicion(prev => ({
        ...prev,
        palabras: [...original.palabras]
      }));
    }
  };

  // Solicitar eliminación de categoría (abre modal propio de confirmación)
  const handleSolicitarEliminarCategoria = () => {
    if (!categoriaEnEdicion.esPropia) return;
    setConfirmarEliminarCat(categoriaEnEdicion);
  };

  const handleEjecutarEliminarCategoria = () => {
    const targetId = confirmarEliminarCat.id;
    const actualizadas = todasCategorias.filter(c => c.id !== targetId);
    saveCategories(actualizadas);
    recargarCategorias();
    
    setCategoriasActivasLocales(prev => prev.filter(id => id !== targetId));
    setConfirmarEliminarCat(null);
    setCategoriaEnEdicion(null);
  };

  const handleGuardarEdicion = () => {
    const actualizadas = todasCategorias.map(c => {
      if (c.id === categoriaEnEdicion.id) {
        return categoriaEnEdicion;
      }
      return c;
    });

    saveCategories(actualizadas);
    recargarCategorias();
    setCategoriaEnEdicion(null);
  };

  const esDiferenteDeDefault = () => {
    if (!categoriaEnEdicion || categoriaEnEdicion.esPropia) return false;
    const original = DEFAULT_CATEGORIES.find(c => c.id === categoriaEnEdicion.id);
    if (!original) return false;
    
    if (original.palabras.length !== categoriaEnEdicion.palabras.length) return true;
    return categoriaEnEdicion.palabras.some(p => !original.palabras.includes(p));
  };

  // --- Botón JUGAR ---
  const handleJugar = () => {
    if (jugadores.length < 3) {
      lanzarError("Se necesitan al menos 3 jugadores para comenzar.");
      return;
    }
    if (categoriasActivasLocales.length === 0) {
      lanzarError("Debes tener al menos 1 categoría seleccionada.");
      return;
    }

    const configuracionPartida = {
      rondas: esInfinito ? 'infinito' : rondasLocales,
      tiempo: tiempoLocal,
      llevarPuntaje: llevarPuntajeLocal,
      categoriasActivas: categoriasActivasLocales
    };

    iniciarNuevaPartida(jugadores, configuracionPartida);
    navegarA('game');
  };

  // Componente Chip de Categoría
  const CategoriaChip = ({ cat }) => {
    const activa = categoriasActivasLocales.includes(cat.id);
    
    const handlers = useLongPress(
      () => abrirEditorCategoria(cat),
      () => toggleCategoria(cat.id),
      { delay: 500 }
    );

    return (
      <button
        type="button"
        {...handlers}
        className={`btn-touch px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center text-center gap-1.5 select-none cursor-pointer transition-all ${
          activa 
            ? 'bg-neon-purple border-neon-purple text-white shadow-md shadow-neon-purple/20' 
            : 'bg-slate-900/40 border-slate-805/80 text-text-sub hover:border-slate-700'
        }`}
      >
        <span className="truncate max-w-[100px]">{cat.nombre}</span>
        {cat.esPropia && (
          <Edit3 className="w-3 h-3 text-neon-green shrink-0" />
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col gap-3.5 py-3 px-3.5 relative">
      
      {/* ⚠️ Banner de Notificación de Error */}
      {notificacionError && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center gap-2 bg-neon-red border-2 border-red-500 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-2xl animate-scale-up">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{notificacionError}</span>
        </div>
      )}

      {/* 🧾 Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <button 
          type="button" 
          className="text-xs font-bold text-text-sub hover:text-white flex items-center gap-1 btn-touch cursor-pointer transition-colors"
          onClick={() => navegarA('home')}
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
        <h2 className="text-sm font-black tracking-widest uppercase text-white font-display">
          Configuración
        </h2>
        <div className="w-12"></div>
      </div>

      {/* 👥 Configuración de Jugadores */}
      <section className="bg-slate-900/40 border border-slate-805/80 rounded-2xl p-3.5 flex flex-col gap-3">
        <h3 className="text-xs font-black tracking-widest uppercase text-neon-green flex items-center gap-2">
          <Users className="w-4 h-4" /> Jugadores ({jugadores.length})
        </h3>
        
        <form onSubmit={handleAgregarJugador} className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple font-semibold"
            placeholder="Nombre del jugador"
            value={nombreJugador}
            onChange={(e) => setNombreJugador(e.target.value)}
          />
          <button
            type="submit"
            className="btn-touch shrink-0 px-3.5 bg-neon-purple hover:bg-violet-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl border-b-4 border-violet-900 flex items-center justify-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </form>

        {jugadores.length === 0 ? (
          <p className="text-text-sub text-[10px] font-bold text-center py-1.5 italic">
            No hay jugadores agregados (mínimo 3).
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {jugadores.map((j) => (
              <div 
                key={j}
                className="bg-slate-950 border border-slate-850 rounded-lg py-1 pl-2.5 pr-1.5 text-[11px] font-bold flex items-center gap-1.5 animate-scale-up"
              >
                <span>{j}</span>
                <button
                  type="button"
                  className="text-neon-red hover:text-red-500 font-extrabold text-base w-4.5 h-4.5 flex items-center justify-center rounded-full hover:bg-slate-900 btn-touch cursor-pointer"
                  onClick={() => handleEliminarJugador(j)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ⚙️ Configuración del Modo de Juego */}
      <section className="bg-slate-900/40 border border-slate-855/80 rounded-2xl p-3.5 flex flex-col gap-3">
        <h3 className="text-xs font-black tracking-widest uppercase text-neon-purple flex items-center gap-2">
          <Settings className="w-4 h-4" /> Ajustes de Partida
        </h3>

        <div className="flex flex-col gap-3 divide-y divide-slate-900 text-xs">
          {/* Rondas Selector */}
          <div className="flex justify-between items-center py-1">
            <div>
              <span className="font-extrabold block">Cantidad de Rondas</span>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-extrabold text-text-sub select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-neon-purple rounded cursor-pointer"
                  checked={esInfinito}
                  onChange={(e) => {
                    setEsInfinito(e.target.checked);
                    if (e.target.checked) setRondasLocales('infinito');
                    else setRondasLocales(5);
                  }}
                />
                <span>Infinito</span>
              </label>

              <div className={`flex items-center border border-slate-850 rounded-xl bg-slate-950 overflow-hidden ${esInfinito ? 'opacity-40' : ''}`}>
                <button
                  type="button"
                  className="px-2.5 py-1 text-neon-purple hover:bg-slate-900 font-black text-xs btn-touch cursor-pointer"
                  disabled={esInfinito}
                  onClick={() => handleRondaChange(-1)}
                >
                  -
                </button>
                <span className="w-6 text-center font-extrabold text-xs">
                  {esInfinito ? '∞' : rondasLocales}
                </span>
                <button
                  type="button"
                  className="px-2.5 py-1 text-neon-purple hover:bg-slate-900 font-black text-xs btn-touch cursor-pointer"
                  disabled={esInfinito}
                  onClick={() => handleRondaChange(1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Tiempo Selector */}
          <div className="flex justify-between items-center pt-3">
            <div>
              <span className="font-extrabold block">Tiempo de Ronda</span>
            </div>

            <div className="flex items-center border border-slate-850 rounded-xl bg-slate-950 overflow-hidden">
              <button
                type="button"
                className="px-2.5 py-1 text-neon-purple hover:bg-slate-900 font-black text-xs btn-touch cursor-pointer"
                onClick={() => handleTiempoChange(-5)}
              >
                -
              </button>
              <input
                type="number"
                className="w-10 bg-transparent text-center font-extrabold text-xs border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={tiempoLocal}
                onChange={(e) => setTiempoLocal(parseInt(e.target.value, 10) || 30)}
                onBlur={handleTiempoBlur}
              />
              <span className="text-[10px] text-text-sub font-bold pr-1.5 flex items-center"><Clock className="w-3 h-3 text-text-sub" /></span>
              <button
                type="button"
                className="px-2.5 py-1 text-neon-purple hover:bg-slate-900 font-black text-xs btn-touch cursor-pointer"
                onClick={() => handleTiempoChange(5)}
              >
                +
              </button>
            </div>
          </div>

          {/* Toggle Puntaje */}
          <div className="flex justify-between items-center pt-3 gap-2">
            <div className="max-w-[70%]">
              <span className="font-extrabold block">Llevar Puntaje</span>
              <span className="text-[9.5px] text-text-sub font-bold tracking-wide uppercase leading-tight block mt-0.5">
                Activalo para usar el tanteador digital de la app, o desactivalo para anotar los puntos en tu hoja
              </span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={llevarPuntajeLocal}
                onChange={(e) => setLlevarPuntajeLocal(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 border border-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:bg-white peer-checked:bg-neon-green peer-checked:border-neon-green"></div>
            </label>
          </div>
        </div>
      </section>

      {/* 🏷️ Chips de Categorías */}
      <section className="bg-slate-900/40 border border-slate-805/80 rounded-2xl p-3.5 flex flex-col gap-2.5">
        <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 flex-wrap gap-1">
          <h3 className="text-xs font-black tracking-widest uppercase text-neon-green flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Categorías ({categoriasActivasLocales.length})
          </h3>
          <span className="text-[9px] text-text-sub font-extrabold italic uppercase tracking-wider">
            Sostené para editar categorías
          </span>
        </div>

        {/* Listado de Chips */}
        <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1 py-0.5">
          {todasCategorias.map((cat) => (
            <CategoriaChip key={cat.id} cat={cat} />
          ))}
        </div>

        <button
          type="button"
          className="btn-touch w-full mt-1 py-2 bg-slate-900 hover:bg-slate-950 border border-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => setModalNuevaCatOpen(true)}
        >
          <Plus className="w-3.5 h-3.5 text-neon-green" /> Nueva Categoría
        </button>
      </section>

      {/* 🚀 Botón Jugar */}
      <div className="mt-1">
        <button
          type="button"
          disabled={jugadores.length < 3 || categoriasActivasLocales.length === 0}
          className={`btn-touch w-full py-4 text-center font-extrabold text-xs uppercase tracking-widest rounded-2xl border-b-4 flex items-center justify-center gap-2 ${
            jugadores.length < 3 || categoriasActivasLocales.length === 0
              ? 'bg-slate-800 border-slate-850 text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-neon-purple hover:bg-violet-750 text-white shadow-xl shadow-neon-purple/20 border-violet-900 cursor-pointer'
          }`}
          onClick={handleJugar}
        >
          <Play className="w-4 h-4" /> JUGAR PARTIDA
        </button>
      </div>

      {/* ➕ Modal: Nueva Categoría */}
      {modalNuevaCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleCrearCategoriaPropia}
            className="bg-space-dark border-2 border-neon-purple rounded-2xl max-w-xs w-full p-6 shadow-2xl relative animate-scale-up"
          >
            <h3 className="text-sm font-black tracking-widest uppercase text-white mb-4 font-display">
              Nueva Categoría Propia
            </h3>
            
            <input
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple font-semibold mb-4"
              placeholder="Nombre de la categoría"
              value={nuevaCatNombre}
              onChange={(e) => setNuevaCatNombre(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-touch flex-1 py-3 bg-slate-900 border border-slate-850 text-text-sub font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                onClick={() => {
                  setNuevaCatNombre("");
                  setModalNuevaCatOpen(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-touch flex-1 py-3 bg-neon-purple hover:bg-violet-750 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-violet-900 cursor-pointer"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📝 Modal: Edición de Categoría (Palabras) */}
      {categoriaEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-space-dark border-2 border-neon-purple rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up flex flex-col max-h-[90vh]">
            
            <button
              type="button"
              className="absolute top-3 right-3 text-text-sub hover:text-white p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
              onClick={() => setCategoriaEnEdicion(null)}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4 pr-6">
              <h3 className="text-sm font-black tracking-widest uppercase text-white font-display truncate max-w-[200px]">
                {categoriaEnEdicion.nombre}
              </h3>
              {categoriaEnEdicion.esPropia && (
                <span className="text-[9px] bg-neon-green/10 text-neon-green border border-neon-green/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  Propia
                </span>
              )}
            </div>

            <form onSubmit={handleAgregarPalabra} className="flex gap-2 mb-3.5">
              <input
                type="text"
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neon-purple font-semibold"
                placeholder="Nueva palabra"
                value={nuevaPalabra}
                onChange={(e) => setNuevaPalabra(e.target.value)}
              />
              <button
                type="submit"
                className="btn-touch px-4 bg-neon-purple hover:bg-violet-750 text-white font-extrabold text-xs uppercase rounded-xl border-b-4 border-violet-900 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 mb-4 max-h-52 min-h-24">
              {categoriaEnEdicion.palabras.length === 0 ? (
                <p className="text-text-sub text-[11px] font-bold italic text-center py-5">
                  Esta categoría no tiene palabras. Agregá algunas para personalizarla.
                </p>
              ) : (
                categoriaEnEdicion.palabras.map((p) => (
                  <div 
                    key={p}
                    className="bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 flex justify-between items-center text-xs font-semibold"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      className="text-neon-red hover:text-red-500 font-extrabold text-base w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-950 btn-touch cursor-pointer"
                      onClick={() => handleEliminarPalabra(p)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-2.5 border-t border-slate-850 pt-3.5">
              <div className="flex gap-2">
                {!categoriaEnEdicion.esPropia && esDiferenteDeDefault() && (
                  <button
                    type="button"
                    className="btn-touch flex-1 py-2.5 bg-slate-900 hover:bg-slate-950 border border-slate-800 text-neon-green font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors"
                    onClick={handleRestaurarDefecto}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                  </button>
                )}

                {categoriaEnEdicion.esPropia && (
                  <button
                    type="button"
                    className="btn-touch flex-1 py-2.5 bg-neon-red/10 hover:bg-neon-red/20 border border-neon-red/30 text-neon-red font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all"
                    onClick={handleSolicitarEliminarCategoria}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar Categoría
                  </button>
                )}
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  className="btn-touch flex-1 py-3 bg-slate-900 border border-slate-850 text-text-sub font-extrabold text-xs uppercase tracking-widest rounded-xl cursor-pointer"
                  onClick={() => setCategoriaEnEdicion(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-touch flex-1 py-3 bg-neon-green text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  onClick={handleGuardarEdicion}
                >
                  <Check className="w-4 h-4 text-slate-950" /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Modal Confirmación Eliminar Categoría (Reemplaza confirm nativo) */}
      {confirmarEliminarCat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xs p-4">
          <div className="bg-space-dark border-2 border-neon-red rounded-2xl max-w-xs w-full p-6 text-center shadow-2xl relative animate-scale-up">
            <div className="mx-auto mb-3.5 w-12 h-12 bg-neon-red/10 border border-neon-red/30 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-neon-red" />
            </div>
            <h4 className="text-sm font-black tracking-widest uppercase text-white mb-2 font-display">
              ¿Eliminar Categoría?
            </h4>
            <p className="text-text-sub text-[11px] leading-relaxed mb-6 font-semibold">
              ¿Seguro que querés eliminar la categoría propia <span className="text-white font-extrabold">"{confirmarEliminarCat.nombre}"</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-touch flex-1 py-2.5 bg-slate-900 border border-slate-850 text-text-sub font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                onClick={() => setConfirmarEliminarCat(null)}
              >
                No, volver
              </button>
              <button
                type="button"
                className="btn-touch flex-1 py-2.5 bg-neon-red hover:bg-red-650 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-red-900 cursor-pointer"
                onClick={handleEjecutarEliminarCategoria}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
