"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Star, Minus, Plus, ImageOff, ShoppingBag, Check, User } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useCart } from "@/components/providers/CartProvider";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { apiFetch, ApiError } from "@/lib/api";
import { flyToCart } from "@/lib/flyToCart";
import { getCached, setCached } from "@/lib/requestCache";

/* ------------------------------- Types ------------------------------- */

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  isFeatured?: boolean;
  effectivePrice?: number;
  discountPercent?: number;
}

interface Review {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

const REVIEW_PREVIEW_COUNT = 3;

/* -------------------------------- Page -------------------------------- */

export default function ProductDetailPage() {
  const { formatPrice } = useCurrency();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { addItem } = useCart();
  const { currentUser } = useAppState();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const productKey = `/products/${id}`;
    const reviewsKey = `/reviews/product/${id}`;
    // A cached product renders immediately — no full-page skeleton flash
    // when re-opening a product you've already viewed — while a fresh
    // copy still loads underneath it.
    const cachedProduct = getCached<Product>(productKey);
    const cachedReviews = getCached<Review[]>(reviewsKey);

    setNotFound(false);
    setProduct(cachedProduct ?? null);
    setRelated([]);
    setReviews(cachedReviews ?? []);
    setActiveImage(0);
    setQuantity(1);
    setReviewRating(0);
    setReviewComment("");
    setReviewError("");
    setLoading(!cachedProduct);

    (async () => {
      try {
        // Product and reviews both only depend on `id`, so fetch them together
        // instead of waiting on the product before starting the reviews call.
        const [productResult, reviewsResult] = await Promise.allSettled([
          apiFetch<Product>(productKey, { auth: false }),
          apiFetch<Review[]>(reviewsKey, { auth: false }),
        ]);
        if (cancelled) return;
        if (productResult.status !== "fulfilled") {
          if (cachedProduct) return; // keep showing the cached product; refresh just failed
          throw productResult.reason;
        }
        const p = productResult.value;
        setProduct(p);
        setCached(productKey, p);
        if (reviewsResult.status === "fulfilled") {
          setReviews(reviewsResult.value);
          setCached(reviewsKey, reviewsResult.value);
        }

        // Bounded (page+limit) so this never pulls down an entire category —
        // or, in the fallback below, the entire catalog — just to show 4 cards.
        try {
          const page = await apiFetch<{ items: Product[] }>(
            `/products?category=${encodeURIComponent(p.category)}&page=1&limit=8`,
            { auth: false }
          );
          if (cancelled) return;
          const sameCategory = page.items.filter((r) => r._id !== p._id);
          if (sameCategory.length >= 4) {
            setRelated(sameCategory.slice(0, 4));
          } else {
            // Not enough products share this exact category — top up with other
            // products so the recommendation section still shows something useful.
            try {
              const fallbackPage = await apiFetch<{ items: Product[] }>(
                `/products?sort=newest&page=1&limit=8`,
                { auth: false }
              );
              if (cancelled) return;
              const usedIds = new Set([p._id, ...sameCategory.map((r) => r._id)]);
              const fallback = fallbackPage.items.filter((r) => !usedIds.has(r._id));
              setRelated([...sameCategory, ...fallback].slice(0, 4));
            } catch {
              if (!cancelled) setRelated(sameCategory.slice(0, 4));
            }
          }
        } catch {
          // Non-fatal: the related-products section just stays empty.
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refetchReviews = async () => {
    try {
      const data = await apiFetch<Review[]>(`/reviews/product/${id}`, { auth: false });
      setReviews(data);
      setCached(`/reviews/product/${id}`, data);
    } catch {
      // Non-fatal — the newly submitted review just won't show until next load.
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    const onSale = !!product.discountPercent && product.discountPercent > 0;
    const price = onSale ? product.effectivePrice ?? product.price : product.price;
    addItem({ productId: product._id, name: product.name, price, imageUrl: product.imageUrl || product.images?.[0] }, quantity);
    toast.success(`${product.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    flyToCart(document.getElementById("product-gallery-image"));
  };

  const decQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const incQuantity = () => setQuantity((q) => Math.max(1, Math.min(product?.stock ?? 1, q + 1)));

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || reviewRating === 0) return;
    setSubmittingReview(true);
    setReviewError("");
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: { productId: product._id, rating: reviewRating, comment: reviewComment.trim() || undefined },
      });
      toast.success("Review submitted");
      setReviewRating(0);
      setReviewComment("");
      await refetchReviews();
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
          <div className="h-4 w-56 bg-white/5 rounded mb-8" />
          <div className="grid md:grid-cols-2 gap-12">
            <div className="aspect-square rounded-2xl bg-white/5" />
            <div className="flex flex-col gap-4">
              <div className="h-6 w-24 bg-white/5 rounded-full" />
              <div className="h-10 w-3/4 bg-white/5 rounded" />
              <div className="h-5 w-40 bg-white/5 rounded" />
              <div className="h-8 w-28 bg-white/5 rounded" />
              <div className="h-24 w-full bg-white/5 rounded" />
              <div className="h-12 w-44 bg-white/5 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="grid place-items-center h-16 w-16 rounded-full bg-white/5 mb-6">
            <ImageOff className="w-7 h-7 text-gray-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Product not found</h1>
          <p className="text-gray-500 text-sm mb-8">
            This product may have been removed or is no longer available.
          </p>
          <Link
            href="/shop"
            className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const gallery = [product.imageUrl, ...(product.images || [])].filter((src): src is string => Boolean(src));
  const mainImage = gallery[activeImage];
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const roundedRating = Math.round(avgRating);

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-xs text-gray-500 mb-8 flex items-center flex-wrap gap-1.5">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-white transition-colors">
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-white transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-400 truncate max-w-[240px]">{product.name}</span>
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="flex flex-col gap-4">
            <div id="product-gallery-image" className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#111113] border border-white/10">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="w-14 h-14 text-gray-600" />
                </div>
              )}
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-black/80 border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-full">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex items-center gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-16 w-16 rounded-xl overflow-hidden border shrink-0 transition-colors ${
                      i === activeImage ? "border-white" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex flex-col">
            <Link
              href={`/shop?category=${encodeURIComponent(product.category)}`}
              className="inline-block w-fit text-xs text-gray-300 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-4 hover:bg-white/10 transition-colors"
            >
              {product.category}
            </Link>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              {reviews.length > 0 ? (
                <>
                  <StarRow rating={roundedRating} />
                  <span className="text-sm text-gray-400">
                    {avgRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">No reviews yet</span>
              )}
            </div>

            {product.discountPercent && product.discountPercent > 0 ? (
              <div className="flex items-center gap-3 mb-4">
                <p className="text-2xl font-semibold text-emerald-400">
                  {formatPrice(product.effectivePrice ?? product.price)}
                </p>
                <p className="text-lg text-gray-500 line-through">{formatPrice(product.price)}</p>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  -{product.discountPercent}%
                </span>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-white mb-4">{formatPrice(product.price)}</p>
            )}

            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                  In Stock{product.stock <= 10 ? ` · Only ${product.stock} left` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                  Out of Stock
                </span>
              )}
            </div>

            <p className="text-gray-400 leading-relaxed mb-6">{product.description}</p>

            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-white/10 rounded-full">
                  <button
                    onClick={decQuantity}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="h-11 w-11 grid place-items-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 rounded-full transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-white">{quantity}</span>
                  <button
                    onClick={incQuantity}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                    className="h-11 w-11 grid place-items-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto flex items-center justify-center gap-2 mb-8"
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added!
                </>
              ) : product.stock <= 0 ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>

            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-3 text-gray-500">Category</td>
                    <td className="px-4 py-3 text-white text-right">{product.category}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-3 text-gray-500">Availability</td>
                    <td className="px-4 py-3 text-white text-right">
                      {product.stock > 0 ? "In Stock" : "Out of Stock"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-500">SKU</td>
                    <td className="px-4 py-3 text-white text-right">
                      {product._id.slice(-8).toUpperCase()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">Reviews</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 flex flex-col gap-4">
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product.</p>
              ) : (
                <>
                  {(showAllReviews ? reviews : reviews.slice(0, REVIEW_PREVIEW_COUNT)).map((r) => (
                    <div key={r._id} className="bg-[#111113] border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <StarRow rating={r.rating} size="w-3.5 h-3.5" />
                        <span className="text-xs text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm text-gray-300 mb-2">{r.comment}</p>}
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> Verified buyer
                      </p>
                    </div>
                  ))}
                  {!showAllReviews && reviews.length > REVIEW_PREVIEW_COUNT && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="text-sm font-medium text-white hover:text-gray-300 transition-colors self-start"
                    >
                      View all {reviews.length} reviews
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              {currentUser ? (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
                >
                  <h3 className="text-sm font-semibold text-white">Write a review</h3>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts (optional)"
                    rows={4}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full resize-none"
                  />
                  {reviewError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">
                      {reviewError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={reviewRating === 0 || submittingReview}
                    className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? "Submitting..." : "Submit review"}
                  </button>
                </form>
              ) : (
                <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
                  <p className="text-sm text-gray-400">Sign in to leave a review.</p>
                  <Link
                    href="/auth"
                    className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/5 transition-colors text-center"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">You might also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <RelatedCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Stars ------------------------------- */

function StarRow({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)} aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}>
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-600 hover:text-gray-400"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* --------------------------- Related product card --------------------------- */

function RelatedCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const { formatPrice } = useCurrency();
  const inStock = product.stock > 0;
  const imgSrc = product.imageUrl || product.images?.[0];
  const onSale = !!product.discountPercent && product.discountPercent > 0;
  const displayPrice = onSale ? product.effectivePrice ?? product.price : product.price;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId: product._id, name: product.name, price: displayPrice, imageUrl: imgSrc }, 1);
    toast.success(`${product.name} added to cart`);
    flyToCart(e.currentTarget.closest("a"));
  };

  return (
    <Link
      href={`/product/${product._id}`}
      className="group relative flex flex-col bg-[#111113] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <ImageOff className="w-7 h-7 text-gray-600" />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-black/80 border border-white/10 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {onSale && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-black text-[11px] font-semibold px-2.5 py-1 rounded-full">
            -{product.discountPercent}%
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4 flex-1">
        <span className="text-xs text-gray-500">{product.category}</span>
        <h3 className="text-sm font-medium text-white line-clamp-2">{product.name}</h3>
        <div className="mt-auto flex items-end justify-between pt-2">
          {onSale ? (
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-emerald-400">{formatPrice(displayPrice)}</span>
              <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
            </span>
          ) : (
            <span className="text-sm font-semibold text-white">{formatPrice(product.price)}</span>
          )}
          {inStock && (
            <button
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="grid place-items-center h-8 w-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
