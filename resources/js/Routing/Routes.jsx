import React from 'react';
import { Route } from "react-router";
import { Routes } from 'react-router-dom';
import Home from '../Pages/Home';
import Main from '../Pages/Main';
import Rate from '../Pages/Rate';
import Zone from '../Pages/Zone'
import Settings from '../Pages/Settings'
import MergeRate from '../Pages/MergeRate';
import AddEditMixMergeRate from '../Pages/AddEditMixMergeRate';
import Demo from '../Pages/Demo';



export default function Routing(props) {
    return (
        <Routes>
            <Route exact path="/zone-data" element={<Home {...props} />} />
            <Route exact path="/Demo" element={<Demo {...props} />} />
            <Route exact path="/Main" element={<Main {...props} />} />
            <Route exact path="/" element={<Settings {...props} />} />
            <Route exact path="/Zone/:zone_id/Rate/Edit/:id" element={<Rate {...props} />} />
            <Route exact path="/Rate/:zone_id" element={<Rate {...props} />} />
            <Route exact path="/Zone" element={<Zone {...props} />} />
            <Route exact path="/Zone/:zone_id" element={<Zone {...props} />} />
            <Route exact path="/mixMergeRate" element={<MergeRate {...props} />} />
            <Route exact path="/add-edit-merge-rate" element={<AddEditMixMergeRate {...props} />} />
            <Route exact path="/add-edit-merge-rate/:id" element={<AddEditMixMergeRate {...props} />} />
        </Routes>
    );
}
