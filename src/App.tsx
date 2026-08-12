import { useState } from "react";
import "./App.css";
import { ThemeToggle } from "./assets/components/atoms/ThemeToggle";
import { DogEar } from "./assets/components/atoms/DogEar";
import { Badge } from "./assets/components/atoms/Badge";
import { HorizontalScroller } from "./assets/components/atoms/HorizontalScroller";
import { Tag } from "./assets/components/atoms/Tag";
import { TagEditor } from "./assets/components/molecules/TagEditor";
import { Input } from "./assets/components/atoms/Input";
import { SearchBar } from "./assets/components/molecules/SearchBar";
import { TagInput } from "./assets/components/molecules/TagInput";
import { DateInput } from "./assets/components/atoms/DateInput";
import { Textarea } from "./assets/components/atoms/Textarea";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "./assets/components/atoms/Button";
import {
  FilterBar,
  type FilterValue,
} from "./assets/components/molecules/FilterBar";
import { Toggle } from "./assets/components/atoms/Toggle";
import { Avatar } from "./assets/components/atoms/Avatar";
import { RatingRow } from "./assets/components/molecules/RatingRow";
import {
  RatingIcon,
  type RatingShape,
  type RatingState,
} from "./assets/components/atoms/RatingIcon";
import { BookCard } from "./assets/components/molecules/BookCard";
import { BookCardReading } from "./assets/components/molecules/BookCardReading";
import { SeriesCard } from "./assets/components/molecules/SeriesCard";
import { TabBar, type TabKey } from "./assets/components/molecules/TabBar";
import { SectionHeader } from "./assets/components/atoms/SectionHeader";
import { Logo } from "./assets/components/atoms/Logo";

function App() {
  const [demoTags, setDemoTags] = useState<string[]>([
    "Realismo mágico",
    "Clásico",
  ]);
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [showGoal, setShowGoal] = useState(true);
  const [recommends, setRecommends] = useState(false);
  const amberShapes: RatingShape[] = [
    "star",
    "candy",
    "crown",
    "gem",
    "sparkle",
  ];
  const greenShapes: RatingShape[] = [
    "droplet",
    "skull",
    "ghost",
    "snail",
    "leaf",
  ];
  const redShapes: RatingShape[] = [
    "flame",
    "heart",
    "swords",
    "drama",
    "wine",
  ];
  const states: RatingState[] = ["empty", "full", "half"];
  const [activeTab, setActiveTab] = useState<TabKey>("mesa");

  function IconGroup({
    shapes,
    color,
  }: {
    shapes: RatingShape[];
    color: string;
  }) {
    return (
      <div className="space-y-2">
        {shapes.map((shape) => (
          <div key={shape} className="flex gap-3">
            {states.map((state) => (
              <RatingIcon
                key={state}
                shape={shape}
                state={state}
                color={color}
                size={28}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-4 space-y-8">
      <ThemeToggle />
      <section>
        <h2 className="font-display text-display-md text-text mb-3">Logo</h2>
        <div className="flex items-center gap-6">
          <Logo variant="full" className="h-10" />
          <Logo variant="icon" className="h-10 w-10" />
        </div>
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">DogEar</h2>
        <div className="flex gap-4">
          <DogEar status="leyendo" />
          <DogEar status="pendiente" />
          <DogEar status="terminado" />
          <DogEar status="deseado" />
          <DogEar status="abandonado" />
        </div>
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge status="leyendo" />
          <Badge status="pendiente" />
          <Badge status="terminado" />
          <Badge status="deseado" />
          <Badge status="abandonado" />
        </div>
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          Tag — editable
        </h2>
        <TagEditor
          initialTags={["Realismo mágico", "Clásico", "GirlsLove", "LGBTQ+"]}
          onChange={(tags) => console.log("Etiquetas:", tags)}
        />
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          Tag — solo lectura
        </h2>
        <HorizontalScroller>
          <Tag label="Realismo mágico" />
          <Tag label="Clásico" />
          <Tag label="GirlsLove" />
          <Tag label="LGBTQ+" />
        </HorizontalScroller>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-display-md text-text mb-3">
          Input — con ícono
        </h2>
        <Input icon={Mail} type="email" placeholder="Correo electrónico..." />
        <Input icon={Lock} type="password" placeholder="Contraseña..." />
        <Input icon={User} type="text" placeholder="Nombre o seudónimo..." />
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          SearchBar
        </h2>
        <SearchBar onCameraClick={() => console.log("Abrir escáner")} />
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          TagInput
        </h2>
        <TagInput onAdd={(tag) => setDemoTags((prev) => [...prev, tag])} />
        <p className="text-body-sm text-text-secondary mt-2">
          Tags agregadas: {demoTags.join(", ")}
        </p>
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          DateInput
        </h2>
        <div className="flex gap-3">
          <DateInput placeholder="Fecha de inicio" />
          <DateInput placeholder="Fecha de finalización" />
        </div>
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          Textarea
        </h2>
        <Textarea placeholder="Escribe tus pensamientos aquí..." />
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-display-md text-text mb-3">Button</h2>
        <Button variant="primary">Iniciar Sesión</Button>
        <Button variant="amber">Editar Libro</Button>
        <Button variant="green">Guardar Cambios</Button>
        <Button variant="slate">Abandonar</Button>
        <Button variant="outline">Cancelar</Button>
        <Button variant="primary" isLoading>
          Cargando...
        </Button>
        <Button variant="primary" disabled>
          Deshabilitado
        </Button>
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          FilterBar (Estante)
        </h2>
        <FilterBar value={filter} onChange={setFilter} />
        <p className="text-body-sm text-text-secondary mt-2">
          Filtro activo: {filter}
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-display-md text-text mb-3">Toggle</h2>
        <Toggle
          checked={showGoal}
          onChange={setShowGoal}
          label="Mostrar meta anual"
        />
        <Toggle
          checked={recommends}
          onChange={setRecommends}
          label="¿Recomiendas este libro?"
        />
        <Toggle
          checked={false}
          onChange={() => {}}
          label="Deshabilitado"
          disabled
        />
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-display-md text-text mb-3">Avatar</h2>
        <div className="flex items-end gap-4">
          <Avatar
            variant="user"
            size="lg"
            onClick={() => console.log("Cambiar foto")}
          />
          <Avatar variant="character" size="md" />
          <Avatar variant="user" size="sm" />
          <Avatar
            variant="user"
            size="lg"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"
          />
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-display-md text-text mb-3">
          RatingIcon
        </h2>
        <RatingRow
          label="General"
          shape="star"
          color="var(--color-accent-reading)"
          value={3.5}
        />
        <RatingRow
          label="Depre"
          shape="droplet"
          color="var(--color-accent-finished)"
          value={4}
        />
        <RatingRow
          label="Calenturiento"
          shape="flame"
          color="var(--color-accent-wishlist)"
          value={2.5}
        />
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          RatingIcon — set completo
        </h2>
        <div className="flex gap-8">
          <IconGroup shapes={amberShapes} color="var(--color-accent-reading)" />
          <IconGroup
            shapes={greenShapes}
            color="var(--color-accent-finished)"
          />
          <IconGroup shapes={redShapes} color="var(--color-accent-wishlist)" />
        </div>
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          BookCard — cuadrícula
        </h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <BookCard
            title="Título corto ejemplo"
            author="Autor del libro"
            status="pendiente"
            onClick={() => console.log("Abrir libro")}
          />
          <BookCard
            title="Título largo ejemplo lalalalala"
            author="Autor del libro"
            status="leyendo"
            isFavorite
            onClick={() => console.log("Abrir libro")}
          />
          <BookCard
            title="Título corto ejemplo"
            author="Autor del libro"
            status="terminado"
            isFavorite
          />
          <BookCard
            title="Título largo ejemplo lalalalala"
            author="Autor del libro"
            status="abandonado"
          />
        </div>
      </section>
      <section className="space-y-3 max-w-sm">
        <h2 className="font-display text-display-md text-text mb-3">
          BookCard — horizontal (Mesa)
        </h2>
        <BookCardReading
          title="Título del libro para llenar 2 líneas."
          author="Autor del libro"
          progressPercent={50}
          progressLabel="Pág. 120"
          onUpdateClick={() => console.log("Actualizar progreso")}
        />
        <BookCardReading
          title="Título del libro para llenar 2 líneas."
          author="Autor del libro"
          progressPercent={50}
          onUpdateClick={() => console.log("Actualizar progreso")}
        />
        <BookCardReading
          title="Título del libro para llenar 2 líneas."
          author="Autor del libro"
          progressPercent={50}
          progressLabel="01h 23m 04s"
          onUpdateClick={() => console.log("Actualizar progreso")}
        />
      </section>
      <section>
        <h2 className="font-display text-display-md text-text mb-3">
          SeriesCard
        </h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <SeriesCard
            title="Título corto ejemplo"
            author="Autor de la saga"
            status="leyendo"
            covers={[
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300",
              "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300",
              undefined,
            ]}
          />
          <SeriesCard
            title="Título corto ejemplo"
            author="Autor de la saga"
            status="pendiente"
            isFavorite
          />
        </div>
      </section>
      <section className="space-y-4">
        <SectionHeader title="Configuración" variant="title" />
        <SectionHeader title="Tema de la aplicación" variant="subtitle" />
      </section>
      

      <div className="pb-20" />{" "}
      {/* espacio para que el contenido no quede tapado por la TabBar */}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;
