import { Show } from "../types";
import { showBones1965 } from "@services/1965-bones";
import { showBones1966 } from "@services/1966-bones";
import { showBones1967 } from "@services/1967-bones";
import { showBones1968 } from "@services/1968-bones";
import { showBones1969 } from "@services/1969-bones";
import { showBones1970 } from "@services/1970-bones";
import { showBones1971 } from "@services/1971-bones";
import { showBones1972 } from "@services/1972-bones";
import { showBones1973 } from "@services/1973-bones";
import { showBones1974 } from "@services/1974-bones";
import { showBones1975 } from "@services/1975-bones";
import { showBones1976 } from "@services/1976-bones";
import { showBones1977 } from "@services/1977-bones";
import { showBones1978 } from "@services/1978-bones";
import { showBones1979 } from "@services/1979-bones";
import { showBones1980 } from "@services/1980-bones";
import { showBones1981 } from "@services/1981-bones";
import { showBones1982 } from "@services/1982-bones";
import { showBones1983 } from "@services/1983-bones";
import { showBones1984 } from "@services/1984-bones";
import { showBones1985 } from "@services/1985-bones";
import { showBones1986 } from "@services/1986-bones";
import { showBones1987 } from "@services/1987-bones";
import { showBones1988 } from "@services/1988-bones";
import { showBones1989 } from "@services/1989-bones";
import { showBones1990 } from "@services/1990-bones";
import { showBones1991 } from "@services/1991-bones";
import { showBones1992 } from "@services/1992-bones";
import { showBones1993 } from "@services/1993-bones";
import { showBones1994 } from "@services/1994-bones";
import { showBones1995 } from "@services/1995-bones";

export const getSelectedYearData = (selectedYear: number): Show[] => {
    if(selectedYear === 1965) { return showBones1965 }
    if(selectedYear === 1966) { return showBones1966 }
    if(selectedYear === 1967) { return showBones1967 }
    if(selectedYear === 1968) { return showBones1968 }
    if(selectedYear === 1969) { return showBones1969 }
    if(selectedYear === 1970) { return showBones1970 }
    if(selectedYear === 1971) { return showBones1971 }
    if(selectedYear === 1972) { return showBones1972 }
    if(selectedYear === 1973) { return showBones1973 }
    if(selectedYear === 1974) { return showBones1974 }
    if(selectedYear === 1975) { return showBones1975 }
    if(selectedYear === 1976) { return showBones1976 }
    if(selectedYear === 1977) { return showBones1977 }
    if(selectedYear === 1978) { return showBones1978 }
    if(selectedYear === 1979) { return showBones1979 }
    if(selectedYear === 1980) { return showBones1980 }
    if(selectedYear === 1981) { return showBones1981 }
    if(selectedYear === 1982) { return showBones1982 }
    if(selectedYear === 1983) { return showBones1983 }
    if(selectedYear === 1984) { return showBones1984 }
    if(selectedYear === 1985) { return showBones1985 }
    if(selectedYear === 1986) { return showBones1986 }
    if(selectedYear === 1987) { return showBones1987 }
    if(selectedYear === 1988) { return showBones1988 }
    if(selectedYear === 1989) { return showBones1989 }
    if(selectedYear === 1990) { return showBones1990 }
    if(selectedYear === 1991) { return showBones1991 }
    if(selectedYear === 1992) { return showBones1992 }
    if(selectedYear === 1993) { return showBones1993 }
    if(selectedYear === 1994) { return showBones1994 }
    if(selectedYear === 1995) { return showBones1995 }
    return [];
}

