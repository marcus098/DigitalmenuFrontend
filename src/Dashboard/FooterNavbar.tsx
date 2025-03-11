import * as React from 'react';

const FooterNavbar: React.FC = () => {

    return(
        <div style={{position: "fixed", bottom: 0, width: "100%", background: "red"}}>
            <div style={{position: "relative", width: "100%", height: "100px"}}>
                <svg
                    style={{position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)"}}
                    width="50"
                    height="50"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="10" cy="10" r="8" fill="#60A5FA"/>
                </svg>

                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 50"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M 0 20
                                L 30 20
                                C 40 20, 50 60, 70 20
                                L 100 20"
                        fill="none"
                        stroke="black"
                        strokeWidth="2"
                    />
                </svg>
            </div>


        </div>
    )
}

export default FooterNavbar;