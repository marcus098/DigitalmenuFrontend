import React, {useEffect, useState} from 'react';
import AllergensSelector from "../../Components/AllergensSelector";
import ClientHeader from "../../Components/ClientHeader";
import ClientCategoriesList from "../../Components/ClientCategoriesList";
import ClientFooter from "../../Components/ClientFooter";
import {allergens} from "../../Utilities/Utilities";
import {useData} from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";
import {useNavigate, useParams} from "react-router-dom";
import CartIcon from "../../Components/Client/CartIcon";


const ClientCategoriesPage: React.FC = () => {
    const restaurantName = "Panineria Creperia Strafame"; // Esempio
    const logoUrl = "/images/logo.png"; // Esempio
    const backgroundUrl = "/images/restaurant-background.jpg"; // USA UNA BELLA IMMAGINE QUI!

    const navigate = useNavigate();
    const { localname } = useParams();

    const { loading, categoriesMap, waiters, setSelectedAllergens } = useData();

    const handleCategorySelect = (categoryId: number) => {
        const waitersUrl = waiters ? "Waiters/" : "";
        navigate(`/${waitersUrl}${localname}/products/${categoryId}`);
    };

    const handleAllergenChange = (selected: number[]) => {
        setSelectedAllergens(selected);
    };

    return (
        <>
            {loading ? <CustomLoading /> :
                <div className="flex flex-col bg-slate-100" style={{minHeight:'105vh'}}>
                    <ClientHeader localname={restaurantName} logo={logoUrl} backgroundImage={backgroundUrl} />
                    <CartIcon />
                    <main className="flex-grow">
                        {/* Contenitore per selettore allergeni e categorie */}
                        <div className="container mx-auto max-w-7xl">
                            {/* Il selettore allergeni è ora integrato prima della lista */}
                            <AllergensSelector allergens={allergens} onAllergenChange={handleAllergenChange} />

                            {/* Divisore opzionale */}
                            <hr className="mx-4 border-gray-200"/>

                            <ClientCategoriesList categories={Array.from(categoriesMap.values())} onSelectCategory={handleCategorySelect} />
                        </div>
                    </main>
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

export default ClientCategoriesPage;
