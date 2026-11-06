import * as React from 'react';
import {useLoginContext} from "../Context/LoginContext";
import CustomLoading from "../Components/CustomLoading";
import Navbar from "./Navbar";
import FooterNavbar from "./FooterNavbar";
import {MOBILE_WIDTH} from "../Utilities/Utilities";
import Sidebar from "./Sidebar";
import NotificationDisplay from "../Components/NotificationDisplay";
import {Navigate, Outlet, useLocation, useParams} from "react-router-dom";
import {IS_ADMIN, IS_WAITER} from "../types";
import ImpersonationBanner from "../Components/ImpersonationBanner";
import {useUtilitiesContext} from "../Context/UtilitiesContext";
import {useEffect} from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

// Pagine della dashboard aperte al cameriere: tutto il resto (menu in modifica, cassa, analytics,
// camerieri, impostazioni...) è solo del titolare e il backend risponderebbe comunque con un errore.
const WAITER_PAGES = ["home", "menu", "tables", "orders", "reservations", "profile"];

const Layout: React.FC = () => {
    const { loading, isSuperadmin, checkVariable } = useLoginContext()
    const { screen } = useUtilitiesContext()
    const { localname } = useParams()
    const location = useLocation()

    useEffect(() => {

    }, [screen]);

    // Il superadmin (fuori da una sessione di supporto) non ha un locale: torna alla console
    if (!loading && isSuperadmin) return <Navigate to="/superadmin" replace />

    // Cameriere su una pagina riservata al titolare → torna alla Home
    if (!loading && checkVariable(IS_WAITER) && !checkVariable(IS_ADMIN)) {
        const page = (location.pathname.split("/Dashboard/")[1] || "").split("/")[0].toLowerCase()
        if (page && !WAITER_PAGES.includes(page)) return <Navigate to={`/${localname}/Dashboard/Home`} replace />
    }

    return (
        <>
            {loading ? <CustomLoading isFullPage={true} message={""} /> :
                <div className="flex flex-col min-h-screen">
                    {/* Banner sessione di supporto + Navbar (Header) */}
                    <div className="sticky top-0 z-40">
                        <ImpersonationBanner />
                        <Header />
                    </div>

                    {/* Sidebar per Desktop */}
                    {/*screen.screen === "DESKTOP" && <Sidebar />*/}

                    {/* Contenuto principale */}
                    <div className="flex-1 bg-slate-100 p-6">
                        <Outlet />
                    </div>

                    {/* Footer per dispositivi mobili
                    {screen.screen !== "DESKTOP" && <Footer />}*/}

                    {/* Notifiche */}
                    <NotificationDisplay />
                </div>
            }
        </>
    );
}

    //return(
    //    <>
    //        {loading ? <CustomLoading isFullPage={true} message={""}/> :
    //        <div>
    //            <Navbar/>
    //            {screen.screen === "DESKTOP" && <Sidebar/>}
    //            <div className={"relative bg-slate-100 min-w-[100%] min-h-[100%]"} style={{minHeight: "calc(100vh - max(10vh, 25px) - 100px)", marginTop: "max(10vh, 25px)", marginBottom: "100px"}}>
    //                <Outlet />
    //            </div>
    //            {screen.screen !== "DESKTOP" && <FooterNavbar/>}
    //            <NotificationDisplay/>
    //        </div>
    //        }
    //    </>
    //)
//}

export default Layout;