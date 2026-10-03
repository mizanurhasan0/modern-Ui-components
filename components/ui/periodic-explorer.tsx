"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

export type PeriodicLayout = "table" | "sphere" | "helix" | "grid";
export interface PeriodicElement {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  category: string;
  configuration: string;
}
export interface PeriodicExplorerProps {
  initialLayout?: PeriodicLayout;
  onSelect?: (element: PeriodicElement) => void;
  className?: string;
}

// Source: PubChem PUG REST periodic table, https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON
// Stored locally so a copied component works without fetching data at runtime.
const ELEMENT_ROWS: [string, string, string, string, string][] = [
  ["H", "Hydrogen", "1.0080", "Nonmetal", "1s1"],
  ["He", "Helium", "4.00260", "Noble gas", "1s2"],
  ["Li", "Lithium", "7.0", "Alkali metal", "[He]2s1"],
  ["Be", "Beryllium", "9.012183", "Alkaline earth metal", "[He]2s2"],
  ["B", "Boron", "10.81", "Metalloid", "[He]2s2 2p1"],
  ["C", "Carbon", "12.011", "Nonmetal", "[He]2s2 2p2"],
  ["N", "Nitrogen", "14.007", "Nonmetal", "[He] 2s2 2p3"],
  ["O", "Oxygen", "15.999", "Nonmetal", "[He]2s2 2p4"],
  ["F", "Fluorine", "18.99840316", "Halogen", "[He]2s2 2p5"],
  ["Ne", "Neon", "20.180", "Noble gas", "[He]2s2 2p6"],
  ["Na", "Sodium", "22.9897693", "Alkali metal", "[Ne]3s1"],
  ["Mg", "Magnesium", "24.305", "Alkaline earth metal", "[Ne]3s2"],
  ["Al", "Aluminum", "26.981538", "Post-transition metal", "[Ne]3s2 3p1"],
  ["Si", "Silicon", "28.085", "Metalloid", "[Ne]3s2 3p2"],
  ["P", "Phosphorus", "30.97376200", "Nonmetal", "[Ne]3s2 3p3"],
  ["S", "Sulfur", "32.07", "Nonmetal", "[Ne]3s2 3p4"],
  ["Cl", "Chlorine", "35.45", "Halogen", "[Ne]3s2 3p5"],
  ["Ar", "Argon", "39.9", "Noble gas", "[Ne]3s2 3p6"],
  ["K", "Potassium", "39.0983", "Alkali metal", "[Ar]4s1"],
  ["Ca", "Calcium", "40.08", "Alkaline earth metal", "[Ar]4s2"],
  ["Sc", "Scandium", "44.95591", "Transition metal", "[Ar]4s2 3d1"],
  ["Ti", "Titanium", "47.867", "Transition metal", "[Ar]4s2 3d2"],
  ["V", "Vanadium", "50.9415", "Transition metal", "[Ar]4s2 3d3"],
  ["Cr", "Chromium", "51.996", "Transition metal", "[Ar]3d5 4s1"],
  ["Mn", "Manganese", "54.93804", "Transition metal", "[Ar]4s2 3d5"],
  ["Fe", "Iron", "55.84", "Transition metal", "[Ar]4s2 3d6"],
  ["Co", "Cobalt", "58.93319", "Transition metal", "[Ar]4s2 3d7"],
  ["Ni", "Nickel", "58.693", "Transition metal", "[Ar]4s2 3d8"],
  ["Cu", "Copper", "63.55", "Transition metal", "[Ar]4s1 3d10"],
  ["Zn", "Zinc", "65.4", "Transition metal", "[Ar]4s2 3d10"],
  ["Ga", "Gallium", "69.723", "Post-transition metal", "[Ar]4s2 3d10 4p1"],
  ["Ge", "Germanium", "72.63", "Metalloid", "[Ar]4s2 3d10 4p2"],
  ["As", "Arsenic", "74.92159", "Metalloid", "[Ar]4s2 3d10 4p3"],
  ["Se", "Selenium", "78.97", "Nonmetal", "[Ar]4s2 3d10 4p4"],
  ["Br", "Bromine", "79.90", "Halogen", "[Ar]4s2 3d10 4p5"],
  ["Kr", "Krypton", "83.80", "Noble gas", "[Ar]4s2 3d10 4p6"],
  ["Rb", "Rubidium", "85.468", "Alkali metal", "[Kr]5s1"],
  ["Sr", "Strontium", "87.62", "Alkaline earth metal", "[Kr]5s2"],
  ["Y", "Yttrium", "88.90584", "Transition metal", "[Kr]5s2 4d1"],
  ["Zr", "Zirconium", "91.22", "Transition metal", "[Kr]5s2 4d2"],
  ["Nb", "Niobium", "92.90637", "Transition metal", "[Kr]5s1 4d4"],
  ["Mo", "Molybdenum", "95.95", "Transition metal", "[Kr]5s1 4d5"],
  ["Tc", "Technetium", "96.90636", "Transition metal", "[Kr]5s2 4d5"],
  ["Ru", "Ruthenium", "101.1", "Transition metal", "[Kr]5s1 4d7"],
  ["Rh", "Rhodium", "102.9055", "Transition metal", "[Kr]5s1 4d8"],
  ["Pd", "Palladium", "106.42", "Transition metal", "[Kr]4d10"],
  ["Ag", "Silver", "107.868", "Transition metal", "[Kr]5s1 4d10"],
  ["Cd", "Cadmium", "112.41", "Transition metal", "[Kr]5s2 4d10"],
  ["In", "Indium", "114.818", "Post-transition metal", "[Kr]5s2 4d10 5p1"],
  ["Sn", "Tin", "118.71", "Post-transition metal", "[Kr]5s2 4d10 5p2"],
  ["Sb", "Antimony", "121.760", "Metalloid", "[Kr]5s2 4d10 5p3"],
  ["Te", "Tellurium", "127.6", "Metalloid", "[Kr]5s2 4d10 5p4"],
  ["I", "Iodine", "126.9045", "Halogen", "[Kr]5s2 4d10 5p5"],
  ["Xe", "Xenon", "131.29", "Noble gas", "[Kr]5s2 4d10 5p6"],
  ["Cs", "Cesium", "132.9054520", "Alkali metal", "[Xe]6s1"],
  ["Ba", "Barium", "137.33", "Alkaline earth metal", "[Xe]6s2"],
  ["La", "Lanthanum", "138.9055", "Lanthanide", "[Xe]6s2 5d1"],
  ["Ce", "Cerium", "140.116", "Lanthanide", "[Xe]6s2 4f1 5d1"],
  ["Pr", "Praseodymium", "140.90766", "Lanthanide", "[Xe]6s2 4f3"],
  ["Nd", "Neodymium", "144.24", "Lanthanide", "[Xe]6s2 4f4"],
  ["Pm", "Promethium", "144.91276", "Lanthanide", "[Xe]6s2 4f5"],
  ["Sm", "Samarium", "150.4", "Lanthanide", "[Xe]6s2 4f6"],
  ["Eu", "Europium", "151.964", "Lanthanide", "[Xe]6s2 4f7"],
  ["Gd", "Gadolinium", "157.25", "Lanthanide", "[Xe]6s2 4f7 5d1"],
  ["Tb", "Terbium", "158.92535", "Lanthanide", "[Xe]6s2 4f9"],
  ["Dy", "Dysprosium", "162.500", "Lanthanide", "[Xe]6s2 4f10"],
  ["Ho", "Holmium", "164.93033", "Lanthanide", "[Xe]6s2 4f11"],
  ["Er", "Erbium", "167.26", "Lanthanide", "[Xe]6s2 4f12"],
  ["Tm", "Thulium", "168.93422", "Lanthanide", "[Xe]6s2 4f13"],
  ["Yb", "Ytterbium", "173.05", "Lanthanide", "[Xe]6s2 4f14"],
  ["Lu", "Lutetium", "174.9667", "Lanthanide", "[Xe]6s2 4f14 5d1"],
  ["Hf", "Hafnium", "178.49", "Transition metal", "[Xe]6s2 4f14 5d2"],
  ["Ta", "Tantalum", "180.9479", "Transition metal", "[Xe]6s2 4f14 5d3"],
  ["W", "Tungsten", "183.84", "Transition metal", "[Xe]6s2 4f14 5d4"],
  ["Re", "Rhenium", "186.207", "Transition metal", "[Xe]6s2 4f14 5d5"],
  ["Os", "Osmium", "190.2", "Transition metal", "[Xe]6s2 4f14 5d6"],
  ["Ir", "Iridium", "192.22", "Transition metal", "[Xe]6s2 4f14 5d7"],
  ["Pt", "Platinum", "195.08", "Transition metal", "[Xe]6s1 4f14 5d9"],
  ["Au", "Gold", "196.96657", "Transition metal", "[Xe]6s1 4f14 5d10"],
  ["Hg", "Mercury", "200.59", "Transition metal", "[Xe]6s2 4f14 5d10"],
  ["Tl", "Thallium", "204.383", "Post-transition metal", "[Xe]6s2 4f14 5d10 6p1"],
  ["Pb", "Lead", "207", "Post-transition metal", "[Xe]6s2 4f14 5d10 6p2"],
  ["Bi", "Bismuth", "208.98040", "Post-transition metal", "[Xe]6s2 4f14 5d10 6p3"],
  ["Po", "Polonium", "208.98243", "Metalloid", "[Xe]6s2 4f14 5d10 6p4"],
  ["At", "Astatine", "209.98715", "Halogen", "[Xe]6s2 4f14 5d10 6p5"],
  ["Rn", "Radon", "222.01758", "Noble gas", "[Xe]6s2 4f14 5d10 6p6"],
  ["Fr", "Francium", "223.01973", "Alkali metal", "[Rn]7s1"],
  ["Ra", "Radium", "226.02541", "Alkaline earth metal", "[Rn]7s2"],
  ["Ac", "Actinium", "227.02775", "Actinide", "[Rn]7s2 6d1"],
  ["Th", "Thorium", "232.038", "Actinide", "[Rn]7s2 6d2"],
  ["Pa", "Protactinium", "231.03588", "Actinide", "[Rn]7s2 5f2 6d1"],
  ["U", "Uranium", "238.0289", "Actinide", "[Rn]7s2 5f3 6d1"],
  ["Np", "Neptunium", "237.048172", "Actinide", "[Rn]7s2 5f4 6d1"],
  ["Pu", "Plutonium", "244.06420", "Actinide", "[Rn]7s2 5f6"],
  ["Am", "Americium", "243.061380", "Actinide", "[Rn]7s2 5f7"],
  ["Cm", "Curium", "247.07035", "Actinide", "[Rn]7s2 5f7 6d1"],
  ["Bk", "Berkelium", "247.07031", "Actinide", "[Rn]7s2 5f9"],
  ["Cf", "Californium", "251.07959", "Actinide", "[Rn]7s2 5f10"],
  ["Es", "Einsteinium", "252.0830", "Actinide", "[Rn]7s2 5f11"],
  ["Fm", "Fermium", "257.09511", "Actinide", "[Rn] 5f12 7s2"],
  ["Md", "Mendelevium", "258.09843", "Actinide", "[Rn]7s2 5f13"],
  ["No", "Nobelium", "259.10100", "Actinide", "[Rn]7s2 5f14"],
  ["Lr", "Lawrencium", "266.120", "Actinide", "[Rn]7s2 5f14 6d1"],
  ["Rf", "Rutherfordium", "267.122", "Transition metal", "[Rn]7s2 5f14 6d2"],
  ["Db", "Dubnium", "268.126", "Transition metal", "[Rn]7s2 5f14 6d3"],
  ["Sg", "Seaborgium", "269.128", "Transition metal", "[Rn]7s2 5f14 6d4"],
  ["Bh", "Bohrium", "270.133", "Transition metal", "[Rn]7s2 5f14 6d5"],
  ["Hs", "Hassium", "269.1336", "Transition metal", "[Rn]7s2 5f14 6d6"],
  ["Mt", "Meitnerium", "277.154", "Transition metal", "[Rn]7s2 5f14 6d7 (calculated)"],
  ["Ds", "Darmstadtium", "282.166", "Transition metal", "[Rn]7s2 5f14 6d8 (predicted)"],
  ["Rg", "Roentgenium", "282.169", "Transition metal", "[Rn]7s2 5f14 6d9 (predicted)"],
  ["Cn", "Copernicium", "286.179", "Transition metal", "[Rn]7s2 5f14 6d10 (predicted)"],
  ["Nh", "Nihonium", "286.182", "Post-transition metal", "[Rn]5f14 6d10 7s2 7p1 (predicted)"],
  ["Fl", "Flerovium", "290.192", "Post-transition metal", "[Rn]7s2 7p2 5f14 6d10 (predicted)"],
  ["Mc", "Moscovium", "290.196", "Post-transition metal", "[Rn]7s2 7p3 5f14 6d10 (predicted)"],
  ["Lv", "Livermorium", "293.205", "Post-transition metal", "[Rn]7s2 7p4 5f14 6d10 (predicted)"],
  ["Ts", "Tennessine", "294.211", "Halogen", "[Rn]7s2 7p5 5f14 6d10 (predicted)"],
  ["Og", "Oganesson", "295.216", "Noble gas", "[Rn]7s2 7p6 5f14 6d10 (predicted)"]
];
const ELEMENTS: readonly PeriodicElement[] = ELEMENT_ROWS.map(([symbol, name, mass, category, configuration], index) => ({ number: index + 1, symbol, name, mass, category, configuration }));
const LAYOUTS: readonly PeriodicLayout[] = ["table", "sphere", "helix", "grid"];
const COLORS: Record<string, string> = { "Nonmetal": "#ef747b", "Noble gas": "#dd8a60", "Halogen": "#ed7486", "Alkali metal": "#e8b05c", "Alkaline earth metal": "#e4d377", "Metalloid": "#c7d45f", "Post-transition metal": "#b2d26b", "Transition metal": "#7bdd87", "Lanthanide": "#6dd1ae", "Actinide": "#6bcabc" };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Conventional 18-column table, with La–Lu and Ac–Lr in separate rows. */
function tablePosition(number: number): { column: number; row: number; period: number; group: number | null } {
  if (number === 1) return { column: 1, row: 1, period: 1, group: 1 };
  if (number === 2) return { column: 18, row: 1, period: 1, group: 18 };
  if (number <= 10) { const group = number <= 4 ? number - 2 : number + 8; return { column: group, row: 2, period: 2, group }; }
  if (number <= 18) { const group = number <= 12 ? number - 10 : number; return { column: group, row: 3, period: 3, group }; }
  if (number <= 36) return { column: number - 18, row: 4, period: 4, group: number - 18 };
  if (number <= 54) return { column: number - 36, row: 5, period: 5, group: number - 36 };
  if (number <= 56) return { column: number - 54, row: 6, period: 6, group: number - 54 };
  if (number <= 71) return { column: number - 54, row: 8.4, period: 6, group: null };
  if (number <= 86) return { column: number - 68, row: 6, period: 6, group: number - 68 };
  if (number <= 88) return { column: number - 86, row: 7, period: 7, group: number - 86 };
  if (number <= 103) return { column: number - 86, row: 9.4, period: 7, group: null };
  return { column: number - 100, row: 7, period: 7, group: number - 100 };
}

function elementTransform(index: number, layout: PeriodicLayout) {
  let x = 0, y = 0, z = 0, rx = 0, ry = 0;
  if (layout === "table") {
    const position = tablePosition(index + 1);
    x = (position.column - 9.5) * 72;
    y = (position.row - 5.2) * 82;
  } else if (layout === "sphere") {
    const latitude = Math.acos(1 - 2 * (index + 0.5) / 118);
    const longitude = index * Math.PI * (3 - Math.sqrt(5));
    x = 420 * Math.sin(latitude) * Math.sin(longitude);
    y = 420 * Math.cos(latitude);
    z = 420 * Math.sin(latitude) * Math.cos(longitude);
    rx = (latitude - Math.PI / 2) * 180 / Math.PI;
    ry = longitude * 180 / Math.PI;
  } else if (layout === "helix") {
    const angle = index * 0.22;
    x = Math.sin(angle) * 425;
    y = (index - 58.5) * 7.2;
    z = Math.cos(angle) * 425;
    ry = angle * 180 / Math.PI;
  } else {
    x = (index % 5 - 2) * 178;
    y = (Math.floor(index / 5) % 5 - 2) * 178;
    z = (Math.floor(index / 25) - 2) * 178;
  }
  return `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,${z.toFixed(3)}px) rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg)`;
}

function ElementContent({ element }: { element: PeriodicElement }) {
  return <><span className="pex-number">{element.number}</span><strong className="pex-symbol">{element.symbol}</strong><span className="pex-name">{element.name}</span><span className="pex-mass">{element.mass}</span></>;
}

/** A CSS 3D periodic table. No canvas renderer, model files, or runtime data requests. */
export default function PeriodicExplorer({ initialLayout = "table", onSelect, className = "" }: PeriodicExplorerProps) {
  const [layout, setLayout] = useState<PeriodicLayout>(initialLayout);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(0.5);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(0);
  const [selected, setSelected] = useState<PeriodicElement>(ELEMENTS[0]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const elementButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const opener = useRef<HTMLButtonElement | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; rx: number; ry: number } | null>(null);
  const id = useId();
  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => ELEMENTS.map((element) => !normalizedQuery || element.name.toLowerCase().includes(normalizedQuery) || element.symbol.toLowerCase() === normalizedQuery || String(element.number) === normalizedQuery), [normalizedQuery]);
  const matchCount = matches.filter(Boolean).length;

  // Open after React commits the selected element so the dialog announces its correct title.
  useEffect(() => {
    if (detailsOpen && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [detailsOpen]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) => { setFit(Math.min(entry.contentRect.width / 1430, entry.contentRect.height / 900)); });
    resize.observe(element);
    function handleWheel(event: WheelEvent) {
      if (!element?.contains(document.activeElement)) return;
      event.preventDefault();
      setZoom((value) => clamp(value * Math.exp(-event.deltaY * 0.0015), 0.5, 2.5));
    }
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => { resize.disconnect(); element.removeEventListener("wheel", handleWheel); };
  }, []);

  function changeLayout(next: PeriodicLayout) {
    setLayout(next);
    setRotation(next === "grid" ? { x: -12, y: 25 } : next === "table" ? { x: 0, y: 0 } : { x: -8, y: 0 });
    setZoom(1);
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button")) return;
    if (event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, rx: rotation.x, ry: rotation.y };
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    setRotation({ x: clamp(drag.current.rx - (event.clientY - drag.current.y) * 0.3, -80, 80), y: drag.current.ry + (event.clientX - drag.current.x) * 0.35 });
  }
  function openElement(element: PeriodicElement, button: HTMLButtonElement) {
    opener.current = button;
    setSelected(element);
    setDetailsOpen(true);
    onSelect?.(element);
  }
  function viewportKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setRotation((value) => ({ x: clamp(value.x + (event.key === "ArrowUp" ? 8 : event.key === "ArrowDown" ? -8 : 0), -80, 80), y: value.y + (event.key === "ArrowLeft" ? -10 : event.key === "ArrowRight" ? 10 : 0) }));
    } else if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault(); setZoom((value) => clamp(value + (event.key === "-" ? -0.15 : 0.15), 0.5, 2.5));
    } else if (event.key === "Home") { event.preventDefault(); changeLayout(layout); }
  }
  function navigateElement(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 117;
    else if (event.key === "ArrowLeft") next = Math.max(0, index - 1);
    else if (event.key === "ArrowRight") next = Math.min(117, index + 1);
    else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const position = tablePosition(index + 1);
      const direction = event.key === "ArrowUp" ? -1 : 1;
      const candidates = ELEMENTS.map((element, candidate) => ({ candidate, position: tablePosition(element.number) })).filter((item) => (item.position.row - position.row) * direction > 0);
      candidates.sort((a, b) => Math.abs(a.position.row - position.row) * 100 + Math.abs(a.position.column - position.column) - Math.abs(b.position.row - position.row) * 100 - Math.abs(b.position.column - position.column));
      next = candidates[0]?.candidate ?? index;
    } else return;
    event.preventDefault();
    setFocused(next);
    elementButtons.current[next]?.focus({ preventScroll: true });
  }
  const selectedPosition = tablePosition(selected.number);

  return <section className={`pex-stage relative w-full overflow-hidden ${className}`} aria-label="Interactive periodic table">
    <PeriodicStyles />
    <div className="pex-toolbar relative z-10 flex flex-wrap items-center justify-center gap-4 px-5 pt-6">
      <div className="flex gap-1" aria-label="Element layout">{LAYOUTS.map((value) => <button type="button" key={value} className="pex-layout" aria-pressed={layout === value} onClick={() => changeLayout(value)}>{value}</button>)}</div>
      <label className="pex-search"><span className="sr-only">Find an element by name, symbol, or atomic number</span><input value={query} onChange={(event) => { const value = event.target.value; setQuery(value); const match = ELEMENTS.findIndex((element) => element.name.toLowerCase().includes(value.toLowerCase()) || element.symbol.toLowerCase() === value.toLowerCase() || String(element.number) === value); if (match >= 0) setFocused(match); }} placeholder="Find an element" /></label>
    </div>
    <p className="sr-only" id={`${id}-instructions`}>Drag empty space to rotate. Focus the scene and use arrows to rotate, plus or minus to zoom, and Home to reset. Tab into the elements, use arrows to explore, and press Enter for details.</p>
    <div ref={viewport} className="pex-viewport relative" tabIndex={0} role="group" aria-label={`${layout} layout`} aria-describedby={`${id}-instructions`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={viewportKey}>
      <div className="pex-camera absolute" style={{ transform: `scale(${fit * zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
        {ELEMENTS.map((element, index) => <button type="button" key={element.number} ref={(button) => { elementButtons.current[index] = button; }} className="pex-element absolute flex flex-col" style={{ transform: elementTransform(index, layout), "--element-color": COLORS[element.category] ?? "#76d3bd", opacity: matches[index] ? 1 : 0.1, transitionDelay: `${index % 13 * 13}ms` } as CSSProperties} aria-label={`${element.number}. ${element.name}, ${element.symbol}`} tabIndex={focused === index ? 0 : -1} onFocus={() => setFocused(index)} onKeyDown={(event) => navigateElement(event, index)} onClick={(event) => openElement(element, event.currentTarget)}><ElementContent element={element} /></button>)}
        {layout === "table" && [6, 7].map((row) => <span key={row} className="pex-placeholder absolute" style={{ transform: `translate3d(${(3 - 9.5) * 72}px,${(row - 5.2) * 82}px,0)` }}>{row === 6 ? "57–71" : "89–103"}<small>{row === 6 ? "Lanthanoids" : "Actinoids"}</small></span>)}
      </div>
    </div>
    <div className="pex-footer flex flex-wrap items-center justify-between gap-3 px-5 pb-5"><p className="pex-hint">{query ? `${matchCount} matching element${matchCount === 1 ? "" : "s"}` : "118 elements · drag to rotate · select to discover"}</p><div className="flex items-center gap-1"><button className="pex-tool" type="button" aria-label="Zoom out" onClick={() => setZoom((value) => clamp(value - 0.2, 0.5, 2.5))}>−</button><button className="pex-tool" type="button" aria-label="Reset view" onClick={() => changeLayout(layout)}>Reset</button><button className="pex-tool" type="button" aria-label="Zoom in" onClick={() => setZoom((value) => clamp(value + 0.2, 0.5, 2.5))}>+</button></div></div>
    <p className="sr-only" role="status" aria-live="polite">{query ? `${matchCount} matching elements` : `${layout} layout`}</p>
    <dialog ref={dialog} className="pex-dialog fixed m-auto rounded-xl border p-7 shadow-2xl" style={{ "--element-color": COLORS[selected.category] ?? "#76d3bd" } as CSSProperties} aria-labelledby={`${id}-element-title`} onClose={() => { setDetailsOpen(false); opener.current?.focus({ preventScroll: true }); }} onClick={(event) => { if (event.target !== event.currentTarget) return; const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close(); }}>
      <button className="pex-close absolute right-4 top-3" type="button" aria-label="Close element details" onClick={() => dialog.current?.close()}>×</button>
      <p className="text-[10px] uppercase tracking-[.17em] opacity-60">Atomic number {selected.number}</p><strong className="mt-4 block text-6xl font-semibold leading-none">{selected.symbol}</strong><h2 id={`${id}-element-title`} className="mb-6 mt-3 text-xl font-medium">{selected.name}</h2>
      <dl className="pex-facts grid grid-cols-2 gap-5"><div><dt>Atomic mass / u</dt><dd>{selected.mass}</dd></div><div><dt>Period</dt><dd>{selectedPosition.period}</dd></div><div><dt>Classification</dt><dd>{selected.category}</dd></div><div><dt>{selectedPosition.group ? "Group" : "Series"}</dt><dd>{selectedPosition.group ?? (selected.number < 80 ? "La–Lu" : "Ac–Lr")}</dd></div><div className="col-span-2"><dt>Electron configuration</dt><dd className="break-words">{selected.configuration || "Not available"}</dd></div></dl>
      <a className="mt-7 inline-flex text-[10px] underline underline-offset-4 opacity-70 hover:opacity-100" href={`https://pubchem.ncbi.nlm.nih.gov/element/${selected.number}`} target="_blank" rel="noreferrer">Element data · PubChem ↗</a>
    </dialog>
  </section>;
}

export function PeriodicExplorerThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = ((Math.trunc(previewStep) % 4) + 4) % 4;
  const layout = LAYOUTS[step];
  return <div className={`pex-stage pex-thumbnail relative w-full overflow-hidden ${className}`} aria-hidden="true"><PeriodicStyles /><div className="pex-thumb-tabs flex justify-center gap-1">{LAYOUTS.map((value) => <span key={value} className="pex-layout" data-active={layout === value}>{value}</span>)}</div><div className="pex-thumb-viewport"><div className="pex-camera" style={{ transform: `scale(var(--pex-thumb-scale)) rotateX(${layout === "table" ? 0 : -12}deg) rotateY(${layout === "table" ? 0 : layout === "grid" ? 25 : step * 20}deg)` }}>{ELEMENTS.map((element, index) => <span key={element.number} className="pex-element absolute flex flex-col" style={{ transform: elementTransform(index, layout), "--element-color": COLORS[element.category] ?? "#76d3bd" } as CSSProperties}><ElementContent element={element} /></span>)}</div></div></div>;
}

function PeriodicStyles() {
  return <style>{`
    .pex-stage{container-type:inline-size;container-name:periodic-explorer;background:#22251e;color:#d6dccb;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    .pex-stage .pex-layout{padding:5px 8px;border:1px solid #ffffff0a;border-radius:2px;background:#ffffff08;color:#a1a694;font-size:10px;line-height:1.4;text-transform:lowercase;transition:background 160ms,color 160ms}
    .pex-stage .pex-layout[aria-pressed=true],.pex-stage .pex-layout[data-active=true]{background:#e2e5dc;color:#32372c;border-color:#e2e5dc}.pex-stage .pex-layout:hover{background:#ffffff26}
    .pex-stage .pex-search input{width:144px;border:1px solid #ffffff13;background:#171a144d;color:#d1daca;border-radius:3px;padding:6px 9px;font-size:10px;outline-offset:3px}.pex-stage .pex-search input::placeholder{color:#7c8473}
    .pex-stage .pex-viewport{height:490px;perspective:1100px;overflow:hidden;touch-action:none;cursor:grab}.pex-stage .pex-viewport:active{cursor:grabbing}.pex-stage .pex-camera{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;transition:transform 140ms ease-out}
    .pex-stage .pex-element{width:64px;height:74px;margin-left:-32px;margin-top:-37px;padding:5px;border:1px solid color-mix(in srgb,var(--element-color) 26%,transparent);border-radius:2px;color:var(--element-color);background:color-mix(in srgb,var(--element-color) 12%,#142017);box-shadow:0 0 10px color-mix(in srgb,var(--element-color) 4%,transparent);backface-visibility:hidden;transition:transform 1250ms cubic-bezier(.2,.75,.2,1),opacity 300ms,background-color 200ms;text-align:left;cursor:pointer}
    .pex-stage .pex-element:hover,.pex-stage .pex-element:focus-visible{background:color-mix(in srgb,var(--element-color) 28%,#172319);border-color:var(--element-color);box-shadow:0 0 25px color-mix(in srgb,var(--element-color) 18%,transparent);outline:1px solid var(--element-color);outline-offset:2px}
    .pex-stage .pex-number{font-size:8px;line-height:1;text-align:right;opacity:.7}.pex-stage .pex-symbol{font-size:24px;line-height:1.3;letter-spacing:-.04em}.pex-stage .pex-name{font-size:6px;white-space:nowrap;letter-spacing:-.03em}.pex-stage .pex-mass{font-size:6px;opacity:.55;margin-top:3px}.pex-stage .pex-placeholder{width:64px;height:74px;margin:-37px 0 0 -32px;border:1px dashed #78886d30;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#87977a;font-size:12px}.pex-stage .pex-placeholder small{font-size:6px;margin-top:7px}
    .pex-stage .pex-hint{font-size:9px;letter-spacing:.015em;color:#88917e}.pex-stage .pex-tool{padding:4px 9px;font-size:10px;color:#b2bba6;border:1px solid #ffffff10;border-radius:3px}.pex-stage .pex-tool:hover{background:#ffffff0d}.pex-stage .pex-viewport:focus-visible{outline:1px solid #81926b;outline-offset:-8px}
    .pex-stage .pex-dialog{width:min(350px,calc(100vw - 32px));max-height:90dvh;overflow-y:auto;border-color:color-mix(in srgb,var(--element-color) 45%,transparent);background:color-mix(in srgb,var(--element-color) 12%,#172018);color:var(--element-color)}.pex-stage .pex-dialog::backdrop{background:#0b100bbb;backdrop-filter:blur(8px)}.pex-stage .pex-close{font-size:25px;font-weight:300;width:28px;height:32px;opacity:.65}.pex-stage .pex-close:hover{opacity:1}.pex-stage .pex-facts dt{font-size:9px;opacity:.6;line-height:1.7}.pex-stage .pex-facts dd{font-size:11px;margin-top:3px;line-height:1.6}.pex-stage button:focus-visible,.pex-stage a:focus-visible{outline:2px solid currentColor;outline-offset:3px}
    .pex-stage.pex-thumbnail{height:100%;min-height:0;display:flex;flex-direction:column;--pex-thumb-scale:.26;pointer-events:none}.pex-thumbnail .pex-thumb-tabs{padding-top:14px;flex-shrink:0}.pex-thumbnail .pex-layout{font-size:7px;padding:3px 5px}.pex-thumbnail .pex-thumb-viewport{flex:1;min-height:0;width:100%;perspective:700px;position:relative}.pex-thumbnail .pex-camera{top:48%}.pex-thumbnail .pex-element{transition:transform 1250ms cubic-bezier(.2,.75,.2,1)}
    @container periodic-explorer (max-width:600px){.pex-stage .pex-viewport{height:410px}.pex-stage .pex-hint{font-size:8px}.pex-stage .pex-toolbar{gap:10px}.pex-stage .pex-search input{width:120px}}
    @container periodic-explorer (max-width:370px){.pex-thumbnail .pex-camera{--pex-thumb-scale:.21}.pex-stage .pex-viewport{height:370px}.pex-stage .pex-footer{justify-content:center}}
    @container periodic-explorer (max-width:280px){.pex-thumbnail .pex-camera{--pex-thumb-scale:.16}}
    @media(prefers-reduced-motion:reduce){.pex-stage *{transition:none!important}}
  `}</style>;
}

export { PeriodicExplorer };
