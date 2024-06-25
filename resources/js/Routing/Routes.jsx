import React from 'react';
import { Route } from "react-router";
import { Routes } from 'react-router-dom';
import Home from '../Pages/Home';
import  Main from '../Pages/Main';
import Rate from '../Pages/Rate';
import Zone from '../Pages/Zone'
import Settings from '../Pages/Settings';


export default function Routing(props) {
    return (
        <Routes>
            <Route exact path="/" element={<Home {...props} />} />
            <Route exact path="/Main" element={<Main {...props} />} />
            <Route exact path="/Settings" element={<Settings {...props} />} />
            {/* <Route exact path="/Rate" element={<Rate {...props} />} /> */}
            <Route exact path="/Rate/:zone_id" element={<Rate {...props} />} />
            <Route exact path="/Zone" element={<Zone {...props} />} />
            <Route exact path="/Zone/:zone_id" element={<Zone {...props} />} />


        </Routes>
    );
}
