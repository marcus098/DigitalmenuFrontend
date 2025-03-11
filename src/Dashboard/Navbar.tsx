import * as React from 'react';
import {useUtilitiesContext} from "../Context/UtilitiesContext";

const Navbar: React.FC = () => {
    const { screen } = useUtilitiesContext()

    return(
        <div className={"flex flex-col bg-amber-400 w-full h-[10vh] min-h-[25px] fixed top-0 right-0"}>

        </div>
    )
}

export default Navbar;