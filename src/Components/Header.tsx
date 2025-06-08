import React from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {useHistory} from "../Context/HistoryContext";
import {FaEdit, FaUser} from "react-icons/fa";
import {FiLogOut} from "react-icons/fi";
import {useLoginContext} from "../Context/LoginContext";

const Header = () => {
    const {localname} = useParams()
    const {navigateWithHistory} = useHistory()
    const {logout} = useLoginContext()

    return (
        <header className="bg-gradient-to-br from-orange-400 via-red-300 to-yellow-400 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <div className="font-semibold text-gray-800" style={{cursor: "pointer"}} onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Home")}>Dashboard</div>
                {/* <input
                    type="text"
                    className="p-2 rounded-md"
                    placeholder="Cerca..."
                /> */}
            </div>
            <div className="flex space-x-4">
                <button className="bg-gray-200 p-2 rounded-full" style={{cursor: "pointer", color: "black"}} onClick={logout}><FiLogOut/></button>
                <button className="bg-gray-200 p-2 rounded-full" style={{cursor: "pointer", color: "black"}} onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Profile")}><FaUser/></button>
            </div>
        </header>
    );
};

export default Header;
