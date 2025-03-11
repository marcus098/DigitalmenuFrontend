import React, { useState } from "react";
import ClientProductCard from "../../Components/ClientProductCard";
import ProductCustomizationDrawer from "../../Components/ProductCustomizationDrawer";
import { useData } from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";
import { useParams } from "react-router-dom";
import { ProductDto } from "../../types";
import ClientHeader from "../../Components/ClientHeader";
import ClientFooter from "../../Components/ClientFooter";
import AllergensSelector from "../../Components/AllergensSelector";
import {allergens} from "../../Utilities/Utilities";
import ClientCategoriesList from "../../Components/ClientCategoriesList";

export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    dish: ProductDto | null;
    onAddToCart: (customDish: CustomDish) => void;
}

export interface CustomDish extends ProductDto {
    quantity: number;
}

const ClientProductsPage: React.FC = () => {
    const [selectedDish, setSelectedDish] = useState<ProductDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [cart, setCart] = useState<CustomDish[]>([]);
    const { loading, allergensMap,ingredientsMap, categoriesMap, productsMap } = useData();
    const { idCategory } = useParams();
    const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);

    const openDrawer = (dish: ProductDto) => {
        setSelectedDish(dish);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
    };

    const addToCart = (customDish: CustomDish) => {
        setCart([...cart, customDish]);
        alert(`${customDish.name} è stato aggiunto al carrello con quantità ${customDish.quantity}.`);
    };

    const handleAllergenChange = (selected: number[]) => {

        setSelectedAllergens(selected);
        console.log('Selected allergens:', selected);
    };

    return (
        <>
            {loading ? (
                <CustomLoading />
            ) : (
                <div className="flex flex-col min-h-screen bg-gray-50">
                    <ClientHeader
                        localname="Panineria creperia Strafame"
                        logo="/images/logo.png"
                    />
                    <main className="flex-grow p-4">
                        {/* Allergeni selezionati */}
                        <div className="p-4">
                            <AllergensSelector allergens={allergens} onAllergenChange={handleAllergenChange}/>
                        </div>

                        {/* Titolo della categoria */}
                        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                            {idCategory && categoriesMap.get(Number(idCategory))?.name || "I nostri piatti"}
                        </h1>

                        {/* Griglia dei prodotti */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {Array.from(productsMap.values()).map((dish) => (
                                <ClientProductCard
                                    key={dish.id}
                                    imageSrc={dish.image || ""}
                                    name={dish.name}
                                    ingredients={dish.ingredients.map(i => ingredientsMap.get(i)?.name).join(", ")}
                                    price={dish.options.find(p => p.isDefault)?.price.toString() || "0"}
                                    //price={`€ ${dish.price.toFixed(2)}`}
                                    onAddToCart={() => openDrawer(dish)}
                                />
                            ))}
                        </div>
                    </main>
                    <ProductCustomizationDrawer
                        isOpen={isDrawerOpen}
                        onClose={closeDrawer}
                        dish={selectedDish}
                        onAddToCart={addToCart}
                    />
                    <ClientFooter
                        address="Via Roma, 123 - Milano"
                        phone="+39 012 345 6789"
                        socialLinks={[
                            { platform: "Facebook", url: "https://facebook.com", icon: "/icons/facebook.png" },
                            { platform: "Instagram", url: "https://instagram.com", icon: "/icons/instagram.png" },
                        ]}
                    />
                </div>
            )}
        </>
    );
};

export default ClientProductsPage;
