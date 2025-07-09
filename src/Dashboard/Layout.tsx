import * as React from 'react';
import {useLoginContext} from "../Context/LoginContext";
import CustomLoading from "../Components/CustomLoading";
import Navbar from "./Navbar";
import FooterNavbar from "./FooterNavbar";
import {MOBILE_WIDTH} from "../Utilities/Utilities";
import Sidebar from "./Sidebar";
import NotificationDisplay from "../Components/NotificationDisplay";
import {Outlet} from "react-router-dom";
import {useUtilitiesContext} from "../Context/UtilitiesContext";
import {useEffect} from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

const Layout: React.FC = () => {
    const { loading } = useLoginContext()
    const { screen } = useUtilitiesContext()

    useEffect(() => {

    }, [screen]);

    return (
        <>
            {loading ? <CustomLoading isFullPage={true} message={""} /> :
                <div className="flex flex-col min-h-screen">
                    {/* Navbar (Header) */}
                    <Header />

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