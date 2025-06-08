import React from 'react';
import {useNavigate, useParams} from "react-router-dom";
import BoxCard from "../../Components/BoxCard";
import {useData} from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";
import {useHistory} from "../../Context/HistoryContext";

const HomePage = () => {
    const {localname} = useParams()
    const {loading, categoriesMap, ingredientsMap, productsMap, comands, tablesMap} = useData()
    const {navigateWithHistory} = useHistory()

    return (
        <>
            {loading ? <CustomLoading isFullPage={true}/> :
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                    {/* Box principali della dashboard */}
                    <BoxCard title={""} value={"Nuovo ordine"} icon={""}
                             onClick={() => navigateWithHistory("/Waiters/" + localname + "/Categories")}/>
                    <BoxCard title={"Layout"} value={"Personalizza"} icon={"📋"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Layout")}/>
                    <BoxCard title={"Ordini"} value={comands.length + " ordini attivi"} icon={"🛒"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Orders")}/>
                    <BoxCard title={"Tavoli"} value={tablesMap.size + " Tavoli"} icon={"🛋️"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Tables")}/>
                    <BoxCard title={"Menu Prodotti"} value={productsMap.size + " Prodotti"} icon={"🍔"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Menu")}/>
                    <BoxCard title={"Ingredienti"} value={ingredientsMap.size + " Ingredienti"} icon={"🛋️"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Ingredients")}/>
                    <BoxCard title={"Categorie"} value={categoriesMap.size + " Categorie"} icon={"🛋️"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Categories")}/>
                    <BoxCard title={"Camerieri"} value={categoriesMap.size + " Camerieri"} icon={"🛋️"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Waiters")}/>
                    {/*<BoxCard title={"Documenti"} value={categoriesMap.size + " Documenti"} icon={"🛋️"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Filemanager")}/>
                    <BoxCard title={"Carte"} value={categoriesMap.size + " Cards"} icon={"🛋️"}
                             onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Cards")}/>*/}
                </div>
            }
        </>
    );
};

export default HomePage;
