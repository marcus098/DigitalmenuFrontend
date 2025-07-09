// src/pages/HomePage.tsx
import React, {useEffect, useState} from 'react';
import { useParams } from "react-router-dom";
import BoxCard from "../../Components/BoxCard";
import { useData } from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";
import { useHistory } from "../../Context/HistoryContext";

// Importa le icone
import {
    PlusCircleIcon,
    ShoppingCartIcon,
    TableCellsIcon,
    BuildingStorefrontIcon,
    CakeIcon,
    TagIcon,
    UsersIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import {useLoginContext} from "../../Context/LoginContext";
import {IS_ADMIN, IS_WAITER} from "../../types";

const HomePage = () => {
    const { localname } = useParams();
    const { loading, categoriesMap, ingredientsMap, productsMap, comands, tablesMap, waiters } = useData();
    const { navigateWithHistory } = useHistory();
    const { user, checkVariable } = useLoginContext()
    const [role, setRole] = useState<number>(0);

    useEffect(() => {
        checkUser()
    }, [])

    useEffect(() => {
        checkUser()
    }, [user])

    const checkUser = () => {
        if(user){
            if(checkVariable(IS_ADMIN))
                setRole(IS_ADMIN)
            else if(checkVariable(IS_WAITER))
                setRole(IS_WAITER)
            else
                setRole(0)
        }
    }

    // Unico array di configurazione per tutte le card.
    // L'ordine determina la posizione nella griglia.
    const dashboardCards = [
        {
            title: "Nuovo Ordine",
            value: "Inizia",
            icon: <PlusCircleIcon />,
            path: `/Waiters/${localname}/Categories`,
            variant: 'primary' as const, // La card primaria mantiene il suo stile, ma non la dimensione
            waiter: true
        },
        {
            title: "Ordini Attivi",
            value: `${comands.length}`,
            icon: <ShoppingCartIcon />,
            path: `/${localname}/Dashboard/Orders`,
            waiter: true
        },
        {
            title: "Menu Prodotti",
            value: `${productsMap.size}`,
            icon: <BuildingStorefrontIcon />,
            path: `/${localname}/Dashboard/Menu`,
            waiter: true
        },
        {
            title: "Tavoli",
            value: `${tablesMap.size}`,
            icon: <TableCellsIcon />,
            path: `/${localname}/Dashboard/Tables`,
            waiter: true
        },
        {
            title: "Camerieri",
            //todo deve essere una mappa waiters
            value: `${waiters || 0}`,
            icon: <UsersIcon />,
            path: `/${localname}/Dashboard/Waiters`,
            waiter: false
        },
        {
            title: "Categorie",
            value: `${categoriesMap.size}`,
            icon: <TagIcon />,
            path: `/${localname}/Dashboard/Categories`,
            waiter: true
        },
        {
            title: "Ingredienti",
            value: `${ingredientsMap.size}`,
            icon: <CakeIcon />,
            path: `/${localname}/Dashboard/Ingredients`,
            waiter: true
        },
        {
            title: "Layout",
            value: "Modifica",
            icon: <ClipboardDocumentListIcon />,
            path: `/${localname}/Dashboard/Layout`,
            waiter: false
        },
        {
            title: "Carte Fedelta'",
            value: "Gestisci",
            icon: <ClipboardDocumentListIcon />,
            path: `/${localname}/Dashboard/Cards`,
            waiter: true
        },
        {
            title: "File manager",
            value: "Gestisci",
            icon: <ClipboardDocumentListIcon />,
            path: `/${localname}/Dashboard/Documents`,
            waiter: false
        }
    ];

    if (loading) {
        return <CustomLoading isFullPage={true} />;
    }

    return (
        <div className="p-4 sm:p-6 bg-slate-100 min-h-screen">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 mt-1">Gestione completa del tuo locale</p>
            </header>

            {/* Griglia UNICA e RESPONSIVE per tutte le card */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {(role === IS_ADMIN ? [...dashboardCards] : [...(dashboardCards.filter(d => d.waiter && role === IS_WAITER))]).map((card) => (
                    <BoxCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        onClick={() => navigateWithHistory(card.path)}
                        variant={card.variant || 'default'}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomePage;