import * as React from 'react';

interface SidebarVoiceMenuProps {
    icon?: string
    value: string
}

const SidebarVoiceMenu: React.FC<SidebarVoiceMenuProps> = ({icon, value}) => {

    return(
        <div className={"flex flex-col fixed left-0 top-0 bottom-0"}>
            <div className={"w-2"}>I</div>
            <div className={"w-max"}>{value}</div>
        </div>
    )
}

export default SidebarVoiceMenu;