// src/pages/client/ProductsPage.tsx

import React, { useState } from 'react';
import { useData } from "../../Context/DataContext";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';

import ClientHeader from "../../Components/ClientHeader";
import ClientFooter from "../../Components/ClientFooter";
import AllergensSelector from "../../Components/AllergensSelector";
import ClientProductCard from "../../Components/ClientProductCard";
import CustomLoading from "../../Components/CustomLoading";
import CartIcon from "../../Components/Client/CartIcon";

import { allergens as mockAllergens } from "../../Utilities/Utilities";
import { ProductDto } from "../../types";
import ProductCustomizationDrawer from "../../Components/ProductCustomizationDrawer";

const ClientProductsPage: React.FC = () => {
    const [selectedDish, setSelectedDish] = useState<ProductDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { loading, setSelectedAllergens, ingredientsMap, categoriesMap, productsMap } = useData();
    const { idCategory, localname } = useParams();
    const navigate = useNavigate();

    const category = idCategory ? categoriesMap.get(Number(idCategory)) : null;

    const openDrawer = (dish: ProductDto) => {
        setSelectedDish(dish);
        setIsDrawerOpen(true);
    };

    return (
        <>
            {loading ? <CustomLoading /> :
                <div className="flex flex-col bg-slate-100" style={{minHeight:'105vh'}}>
                    <ClientHeader
                        localname={category?.name || "I nostri Prodotti"}
                        backgroundImage={category?.image ? process.env.REACT_APP_BUCKET_URL + category.image : "/images/restaurant-background.jpg"}
                    />
                    <CartIcon />
                    <main className="flex-grow">
                        <div className="container mx-auto max-w-7xl">
                            <div className="p-4">
                                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary font-semibold transition-colors mb-4">
                                    <FaArrowLeft />
                                    <span>Torna alle Categorie</span>
                                </button>
                                <AllergensSelector allergens={mockAllergens} onAllergenChange={setSelectedAllergens} />
                            </div>
                            <hr className="mx-4 border-gray-200"/>

                            {/* Griglia dei prodotti */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-6">
                                {Array.from(productsMap.values())
                                    .filter((p) => p.idCategory === Number(idCategory))
                                    .map((dish) => (
                                        <ClientProductCard
                                            key={dish.id}
                                            imageSrc={dish.image || ""}
                                            name={dish.name}
                                            ingredients={dish.ingredients.map(i => ingredientsMap.get(i)?.name).join(", ")}
                                            options={dish.options}
                                            onAddToCart={() => openDrawer(dish)}
                                        />
                                    ))}
                            </div>
                        </div>
                    </main>
                    <ProductCustomizationDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        dish={selectedDish}
                        waiter={window.location.href.toLowerCase().includes("/waiters/")}
                    />
                    <ClientFooter
                        address="Via Roma, 123 - Milano"
                        phone="+39 012 345 6789"
                        socialLinks={[/*...*/]}
                    />
                </div>
            }
        </>
    );
};

export default ClientProductsPage;