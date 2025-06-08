import React, {useContext, useState} from "react";
import ClientProductCard from "../../Components/ClientProductCard";
import ProductCustomizationDrawer from "../../Components/ProductCustomizationDrawer";
import { useData } from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";
import { useParams } from "react-router-dom";
import { ProductDto } from "../../types";
import ClientHeader from "../../Components/ClientHeader";
import ClientFooter from "../../Components/ClientFooter";
import AllergensSelector from "../../Components/AllergensSelector";
import { allergens } from "../../Utilities/Utilities";
import {ThemeContext} from "../../Context/ThemeContext";
import CartIcon from "../../Components/Client/CartIcon";

export interface CustomDish extends ProductDto {
    quantity: number;
}

const ClientProductsPage: React.FC = () => {
    const [selectedDish, setSelectedDish] = useState<ProductDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [cart, setCart] = useState<CustomDish[]>([]);
    const { loading, allergensMap, setSelectedAllergens, ingredientsMap, categoriesMap, productsMap } = useData();
    const { idCategory } = useParams();

    const theme = useContext(ThemeContext)

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


    return (
        <>
            {loading ? (
                <CustomLoading />
            ) : (
                <div className="flex flex-col min-h-screen text-gray-900" style={{backgroundColor: theme?.theme.colors.color1 + ""}}>
                    <CartIcon />
                    <ClientHeader
                        localname="Panineria creperia Strafame"
                        logo="/images/logo.png"
                    />
                    <main className="flex-grow p-6">
                        {/* Selettore allergeni */}
                        <div>
                            <AllergensSelector allergens={allergens} onAllergenChange={setSelectedAllergens} />
                        </div>

                        {/* Titolo della categoria */}
                        <h1 className="text-4xl font-extrabold text-center mb-8" style={{color: theme?.theme.colors.text1 + ""}}>
                            {idCategory && (categoriesMap.get(Number(idCategory))?.name || "I nostri piatti")}
                        </h1>

                        {/* Griglia dei prodotti */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {Array.from(productsMap.values()).filter((p) => p.idCategory === Number(idCategory)).map((dish) => (
                                <ClientProductCard
                                    key={dish.id}
                                    imageSrc={dish.image ? process.env.REACT_APP_BUCKET_URL + dish.image : ""}
                                    name={dish.name}
                                    ingredients={dish.ingredients.map(i => ingredientsMap.get(i)?.name).join(", ")}
                                    options={dish.options}
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
                        waiter={window.location.href.toLowerCase().includes("/waiters/")}
                        //imageSrc={""}
                        //name={selectedDish?.name || ""}
                        //ingredients={"test"}
                        //price={selectedDish?.options.find(p => p.isDefault)?.price.toString()  || ""}
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
