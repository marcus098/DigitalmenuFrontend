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
    const restaurantName = "Panineria creperia Strafame";
    const logo = "/images/logo.png";
    const navigate = useNavigate()
    const {localname} = useParams()


    const {loading, categoriesMap, waiters, setSelectedAllergens} = useData()

    const handleCategorySelect = (categoryId: number) => {
        const waitersUrl = waiters ? "Waiters/" : ""
        navigate("/" + waitersUrl + localname + "/products/" + categoryId.toString())
    };

    const handleAllergenChange = (selected: number[]) => {
        setSelectedAllergens(selected);
        console.log('Selected allergens:', selected);
    };

    return (
        <>{loading ? <CustomLoading/> :
            <div className="flex flex-col min-h-screen bg-gray-50">
                <ClientHeader localname={restaurantName} logo={logo} />
                <CartIcon />
                <main className="flex-grow">
                    <div className="p-4">
                        <AllergensSelector allergens={allergens} onAllergenChange={handleAllergenChange} />
                    </div>
                    <ClientCategoriesList categories={Array.from(categoriesMap.values())} onSelectCategory={handleCategorySelect} />
                </main>
                <ClientFooter
                    address="Via Roma, 123 - Milano"
                    phone="+39 012 345 6789"
                    socialLinks={[
                        { platform: 'Facebook', url: 'https://facebook.com', icon: '/icons/facebook.png' },
                        { platform: 'Instagram', url: 'https://instagram.com', icon: '/icons/instagram.png' },
                    ]}
                />
            </div>}
            </>
    );
};

export default ClientCategoriesPage;
