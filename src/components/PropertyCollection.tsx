import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Ruler,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { properties, type Category, type Property } from "../data/properties";
import {
  filterProperties,
  parseSavedHomes,
  SAVED_HOMES_STORAGE_KEY,
  toggleSavedHome,
} from "../lib/collection";
import "./property-collection.css";

export type PropertyCollectionProps = {
  category: Category | "All";
  onCategoryChange: (category: Category | "All") => void;
  savedOnly: boolean;
  onShowAll: () => void;
  onInquire: (property?: Property) => void;
  onSavedChange: (count: number) => void;
};

const CATEGORY_FILTERS: Array<{ label: string; value: Category | "All" }> = [
  { label: "All homes", value: "All" },
  { label: "Coastal", value: "Coastal" },
  { label: "City", value: "City" },
  { label: "Countryside", value: "Countryside" },
];

const VALID_PROPERTY_IDS = new Set(properties.map((property) => property.id));
const areaFormatter = new Intl.NumberFormat("en-US");

function readSavedHomes(): Set<string> {
  try {
    if (typeof window === "undefined") return new Set<string>();

    return new Set(
      parseSavedHomes(window.localStorage.getItem(SAVED_HOMES_STORAGE_KEY), VALID_PROPERTY_IDS),
    );
  } catch {
    return new Set<string>();
  }
}

function categoryName(category: Category | "All"): string {
  return category === "All" ? "all settings" : category.toLowerCase();
}

function PropertyStats({ property }: { property: Property }) {
  return (
    <span className="property-card__stats" aria-label={`${property.beds} beds, ${property.baths} baths, ${areaFormatter.format(property.area)} square feet`}>
      <span className="property-card__stat">
        <BedDouble aria-hidden="true" size={15} strokeWidth={1.6} />
        <span>{property.beds} beds</span>
      </span>
      <span className="property-card__stat">
        <Bath aria-hidden="true" size={15} strokeWidth={1.6} />
        <span>{property.baths} baths</span>
      </span>
      <span className="property-card__stat">
        <Ruler aria-hidden="true" size={15} strokeWidth={1.6} />
        <span>{areaFormatter.format(property.area)} sq ft</span>
      </span>
    </span>
  );
}

function PropertyCollection({
  category,
  onCategoryChange,
  savedOnly,
  onShowAll,
  onInquire,
  onSavedChange,
}: PropertyCollectionProps) {
  const [savedHomes, setSavedHomes] = useState<Set<string>>(readSavedHomes);
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onSavedChangeRef = useRef(onSavedChange);
  const dialogId = useId().replace(/:/g, "");
  const dialogTitleId = `home-dialog-title-${dialogId}`;
  const dialogDescriptionId = `home-dialog-description-${dialogId}`;

  const categoryMatches = useMemo(
    () => filterProperties(properties, category),
    [category],
  );
  const visibleProperties = useMemo(
    () => filterProperties(properties, category, savedOnly, savedHomes),
    [category, savedHomes, savedOnly],
  );
  const activeImage = activeProperty?.images[activeImageIndex] ?? null;
  const activePropertyIsSaved = activeProperty ? savedHomes.has(activeProperty.id) : false;

  useEffect(() => {
    onSavedChangeRef.current = onSavedChange;
  }, [onSavedChange]);

  useEffect(() => {
    onSavedChangeRef.current(savedHomes.size);
  }, [savedHomes.size]);

  useEffect(() => {
    const validSavedHomes = parseSavedHomes(JSON.stringify([...savedHomes]), VALID_PROPERTY_IDS);

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SAVED_HOMES_STORAGE_KEY, JSON.stringify(validSavedHomes));
      }
    } catch {
      // Browsers can deny storage access; the collection remains usable in memory.
    }
  }, [savedHomes]);

  useEffect(() => {
    if (!activeProperty) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    try {
      if (!dialog.open) dialog.showModal();
    } catch {
      // A browser without dialog support should still leave the page usable.
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [activeProperty]);

  useEffect(() => {
    if (!activeProperty || typeof document === "undefined") return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [activeProperty]);

  const handleFavoriteToggle = useCallback((propertyId: string) => {
    setSavedHomes((current) => new Set(toggleSavedHome(current, propertyId, VALID_PROPERTY_IDS)));
  }, []);

  const handleOpenProperty = useCallback((property: Property, opener: HTMLElement) => {
    openerRef.current = opener;
    setActiveImageIndex(0);
    setActiveProperty(property);
  }, []);

  const restoreFocus = useCallback(() => {
    const opener = openerRef.current;
    openerRef.current = null;

    if (opener && opener.isConnected) {
      window.requestAnimationFrame(() => opener.focus());
    }
  }, []);

  const handleDialogClose = useCallback(() => {
    setActiveProperty(null);
    setActiveImageIndex(0);
    restoreFocus();
  }, [restoreFocus]);

  const closeDialog = useCallback(() => {
    const dialog = dialogRef.current;

    if (dialog?.open) {
      dialog.close();
    } else {
      handleDialogClose();
    }
  }, [handleDialogClose]);

  const moveGallery = useCallback((direction: number) => {
    setActiveImageIndex((currentIndex) => {
      if (!activeProperty || activeProperty.images.length < 2) return currentIndex;

      const imageCount = activeProperty.images.length;
      return (currentIndex + direction + imageCount) % imageCount;
    });
  }, [activeProperty]);

  const handleInquire = useCallback(() => {
    if (!activeProperty) return;

    const property = activeProperty;
    closeDialog();
    onInquire(property);
  }, [activeProperty, closeDialog, onInquire]);

  const handleDialogBackdropClick = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  }, [closeDialog]);

  const renderEmptyState = () => {
    if (category !== "All" && categoryMatches.length === 0) {
      return (
        <div className="collection__empty" role="status">
          <p className="collection__empty-kicker">A quieter edit</p>
          <h2>No homes in {categoryName(category)}</h2>
          <p>Try another setting to continue exploring the Aurel collection.</p>
          <button className="collection__empty-action" type="button" onClick={() => onCategoryChange("All")}>
            View all homes
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
          </button>
        </div>
      );
    }

    if (savedOnly) {
      return (
        <div className="collection__empty" role="status">
          <p className="collection__empty-kicker">Your considered edit</p>
          <h2>No saved homes here yet</h2>
          <p>Keep a few possibilities close, then return when the right feeling arrives.</p>
          <button className="collection__empty-action" type="button" onClick={onShowAll}>
            Explore all homes
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
          </button>
        </div>
      );
    }

    return (
      <div className="collection__empty" role="status">
        <p className="collection__empty-kicker">A considered collection</p>
        <h2>No homes match this edit</h2>
        <p>Reset the setting to see every home in the portfolio.</p>
        <button className="collection__empty-action" type="button" onClick={() => onCategoryChange("All")}>
          View all homes
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
        </button>
      </div>
    );
  };

  return (
    <section className="collection" aria-label="Property collection">
      <div className="collection__controls">
        <div className="collection__filters" role="group" aria-label="Filter homes by setting">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              className={`collection__filter${category === filter.value ? " collection__filter--active" : ""}`}
              key={filter.value}
              type="button"
              aria-pressed={category === filter.value}
              onClick={() => onCategoryChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="collection__result-count" role="status" aria-live="polite" aria-atomic="true">
          <strong>{visibleProperties.length}</strong>
          {savedOnly ? " saved " : " "}
          {visibleProperties.length === 1 ? "home" : "homes"}
          <span className="collection__result-context"> · {categoryName(category)}</span>
        </p>
      </div>

      {visibleProperties.length > 0 ? (
        <div className="collection__grid">
          {visibleProperties.map((property) => {
            const isSaved = savedHomes.has(property.id);

            return (
              <article className={`property-card${isSaved ? " property-card--saved" : ""}`} key={property.id}>
                <button
                  className="property-card__open"
                  type="button"
                  onClick={(event) => handleOpenProperty(property, event.currentTarget)}
                  aria-label={`View details for ${property.title}`}
                >
                  <span className="property-card__media">
                    <img
                      className="property-card__image"
                      src={property.images[0].src}
                      alt={property.images[0].alt}
                      loading="lazy"
                    />
                    <span className="property-card__media-wash" aria-hidden="true" />
                    <span className="property-card__view-label">View home <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.7} /></span>
                  </span>
                  <span className="property-card__content">
                    <span className="property-card__topline">
                      <span className="property-card__tag">{property.tag}</span>
                      <span className="property-card__category">{property.category}</span>
                    </span>
                    <span className="property-card__location"><MapPin aria-hidden="true" size={14} strokeWidth={1.6} /> {property.location}</span>
                    <span className="property-card__title">{property.title}</span>
                    <span className="property-card__footer">
                      <span className="property-card__price">{property.priceLabel}</span>
                      <PropertyStats property={property} />
                    </span>
                  </span>
                </button>
                <button
                  className={`property-card__favorite${isSaved ? " property-card__favorite--saved" : ""}`}
                  type="button"
                  aria-pressed={isSaved}
                  aria-label={isSaved ? `Remove ${property.title} from saved homes` : `Save ${property.title}`}
                  onClick={() => handleFavoriteToggle(property.id)}
                >
                  <Heart aria-hidden="true" size={18} strokeWidth={1.6} fill={isSaved ? "currentColor" : "none"} />
                  <span className="collection__visually-hidden">{isSaved ? "Saved" : "Save home"}</span>
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        renderEmptyState()
      )}

      <dialog
        ref={dialogRef}
        className="home-dialog"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={handleDialogClose}
        onClick={handleDialogBackdropClick}
      >
        {activeProperty && activeImage ? (
          <div className="home-dialog__shell">
            <div className="home-dialog__header">
              <p className="home-dialog__eyebrow">Aurel private portfolio</p>
              <button className="home-dialog__close" type="button" onClick={closeDialog} aria-label="Close property details" ref={closeButtonRef}>
                <X aria-hidden="true" size={19} strokeWidth={1.5} />
              </button>
            </div>

            <div className="home-dialog__gallery">
              <div className="home-dialog__hero-image-wrap">
                <img className="home-dialog__hero-image" src={activeImage.src} alt={activeImage.alt} />
                <div className="home-dialog__gallery-controls">
                  <button className="home-dialog__gallery-button" type="button" onClick={() => moveGallery(-1)} aria-label="Previous property image">
                    <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
                  </button>
                  <span className="home-dialog__image-count" role="status" aria-live="polite" aria-atomic="true">
                    {activeImageIndex + 1} / {activeProperty.images.length}
                  </span>
                  <button className="home-dialog__gallery-button" type="button" onClick={() => moveGallery(1)} aria-label="Next property image">
                    <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="home-dialog__thumbnails" aria-label={`${activeProperty.title} gallery`}>
                {activeProperty.images.map((image, imageIndex) => (
                  <button
                    className={`home-dialog__thumbnail${imageIndex === activeImageIndex ? " home-dialog__thumbnail--active" : ""}`}
                    key={image.src}
                    type="button"
                    aria-label={`Show image ${imageIndex + 1} of ${activeProperty.images.length}`}
                    aria-pressed={imageIndex === activeImageIndex}
                    onClick={() => setActiveImageIndex(imageIndex)}
                  >
                    <img src={image.src} alt={image.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            <div className="home-dialog__body">
              <div className="home-dialog__copy">
                <span className="home-dialog__tag">{activeProperty.tag}</span>
                <p className="home-dialog__location"><MapPin aria-hidden="true" size={15} strokeWidth={1.6} /> {activeProperty.location}</p>
                <h2 id={dialogTitleId}>{activeProperty.title}</h2>
                <p id={dialogDescriptionId} className="home-dialog__description">{activeProperty.description}</p>

                <div className="home-dialog__facts" aria-label="Property facts">
                  <span className="home-dialog__fact"><BedDouble aria-hidden="true" size={18} strokeWidth={1.5} /><strong>{activeProperty.beds}</strong><small>Bedrooms</small></span>
                  <span className="home-dialog__fact"><Bath aria-hidden="true" size={18} strokeWidth={1.5} /><strong>{activeProperty.baths}</strong><small>Bathrooms</small></span>
                  <span className="home-dialog__fact"><Ruler aria-hidden="true" size={18} strokeWidth={1.5} /><strong>{areaFormatter.format(activeProperty.area)}</strong><small>Square feet</small></span>
                </div>
              </div>

              <aside className="home-dialog__aside">
                <div className="home-dialog__price-block">
                  <span className="home-dialog__price-label">Concept value</span>
                  <strong>{activeProperty.priceLabel}</strong>
                </div>
                <div className="home-dialog__amenities">
                  <p className="home-dialog__section-label">Considered details</p>
                  <ul>
                    {activeProperty.features.map((feature) => (
                      <li key={feature}><Check aria-hidden="true" size={15} strokeWidth={1.7} /> {feature}</li>
                    ))}
                  </ul>
                </div>
                <p className="home-dialog__disclosure">Portfolio concept · Not a live listing</p>
                <div className="home-dialog__actions">
                  <button className={`home-dialog__save${activePropertyIsSaved ? " home-dialog__save--saved" : ""}`} type="button" aria-pressed={activePropertyIsSaved} onClick={() => handleFavoriteToggle(activeProperty.id)}>
                    <Heart aria-hidden="true" size={17} strokeWidth={1.6} fill={activePropertyIsSaved ? "currentColor" : "none"} />
                    {activePropertyIsSaved ? "Saved" : "Save home"}
                  </button>
                  <button className="home-dialog__inquire" type="button" onClick={handleInquire}>
                    Enquire about this home
                    <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.6} />
                  </button>
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}

export default PropertyCollection;
