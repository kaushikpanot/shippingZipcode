import { Route } from "react-router";
import { Routes } from 'react-router-dom';
import Home from '../Pages/Home';
import  Main from '../Pages/Main'
import React from 'react';


export default function Routing(props) {
    return (
        <Routes>
            <Route exact path="/" element={<Home {...props} />} />
            <Route exact path="/Main" element={<Main {...props} />} />

        </Routes>
    );
}
