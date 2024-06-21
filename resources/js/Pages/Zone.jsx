import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
    Page,
    Button,
    LegacyCard,
    Divider,
    Grid,
    Text,
    ChoiceList,
    TextField,
    Checkbox,
    Tooltip,
    FormLayout,
    Select,
    ButtonGroup,
    Card,
    Link,
    Toast,
    IndexTable,
    useIndexResourceState,
    Badge,
} from '@shopify/polaris';
import '../../../public/css/style.css';
import {
    SearchIcon,
    ResetIcon
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;



function Help() {
    const navigate = useNavigate();
    const [country, setCountry] = useState([])
    const [currencys, setCurrencys] = useState([])
    const [toastContent, setToastContent] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const toastDuration = 3000;

    const [formData, setFormData] = useState({
        name: "",
        currency: "",
        country: "",
    });
    const handleConfigrationSettings = (field) => (value) => {
        setFormData((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        setFormErrors((prevErrors) => ({
            ...prevErrors,
            [field]: ""
        }));

    };
    const [selected, setSelected] = useState(['enable']);
    const handleChange = useCallback((value) => setSelected(value), []);
    const [select, setSelect] = useState('today');

    const handleSelectChange = useCallback(
        (value) => setSelect(value),
        [],
    );

    const options = [
        { label: 'Status' },
        { label: 'Enable', value: 'enable' },
        { label: 'Disable', value: 'disable' },
    ];
    const handleEditForm = () => {
        navigate('/Rate');
        console.log('navigate on Rule')
    };

    const navigateHome = () => {
        // 👇️ Navigate to /
        navigate('/');
    };
    const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: new URLSearchParams(location.search).get("host"),
    });
    const getCountry = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.get(`${apiCommonURL}/api/country`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const countryData = response.data;
            const stateList = countryData.countries.map(state => ({
                label: `${state.name} (${state.code})`,
                value: state.code
            }));
            setCountry(stateList);

        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }

    const getCurrency = async () => {
        try {
            const token = await getSessionToken(app);

            const response = await axios.get(`${apiCommonURL}/api/currency`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const countryData = response.data.currencies;

            const currency = countryData.map(cuency => ({
                label: cuency.currency,
                value: cuency.currency
            }))
            setCurrencys(currency)
        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }
    const editData = async () => {
        try {
            const token = await getSessionToken(app);

            const response = await axios.get(`${apiCommonURL}/api/zone/3/edit`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(response.data)
        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }
    useEffect(() => {
        getCountry()
        getCurrency()
        editData()
    }, [])
    const validateFields = () => {
        let isValid = true;

        for (const key in formData) {
            if (!formData[key].trim()) {
                setFormErrors((prevFormErrors) => ({
                    ...prevFormErrors,
                    [key]: `${key.charAt(0).toUpperCase() + key.slice(1)} is required `
                }));
                isValid = false;
            } else {
                setFormErrors((prevFormErrors) => ({
                    ...prevFormErrors,
                    [key]: ""
                }));
            }
        }

        return isValid;
    };

    const saveZone = async () => {
        if (!validateFields()) {
            return;
        }
        try {
            const token = await getSessionToken(app);
            const selectedCountry = country.find(country => country.value === formData.country);
            const dataToSubmit = {
                ...formData,
                country: selectedCountry ? selectedCountry.label : formData.country,
            };
            const response = await axios.post(`${apiCommonURL}/api/zone/save`, dataToSubmit, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Response:', response.data);
            setToastContent("Data has been added successfully");
            setShowToast(true);

        } catch (error) {
            console.error('Error occurs', error);
            setToastContent("Error occurred while saving data");
            setShowToast(true);
        }
    }


    const orders = [
        {
            id: '1020',
            order: '#1020',
            date: 'Jul 20 at 4:34pm',
            customer: 'Jaydon Stanton',
            total: '$969.44',
           
        },
        {
            id: '1019',
            order: '#1019',
            date: 'Jul 20 at 3:46pm',
            customer: 'Ruben Westerfelt',
            total: '$701.19',
     },
        {
            id: '1018',
            order: '#1018',
            date: 'Jul 20 at 3.44pm',
            customer: 'Leo Carder',
            total: '$798.24',
            },
    ];
    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(orders);

    const rowMarkup = orders.map(
        (
            { id, order, date, customer, total},
            index,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {order}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{date}</IndexTable.Cell>
                <IndexTable.Cell>{customer}</IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" alignment="end" numeric>
                        {total}
                    </Text>
                </IndexTable.Cell>
               
            </IndexTable.Row>
        ),
    );
    return (
        <Page
            fullWidth
            title="Add Zone"
            primaryAction={<Button variant="primary" onClick={saveZone}>Save</Button>}
            secondaryActions={<Button onClick={navigateHome}>Back</Button>}
        >
            <Divider borderColor="border" />
            <div style={{ marginTop: '2%', marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '10%' }}>
                            <Text variant="headingLg" as="h5">
                                Zone Details
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Enable and disable zone without deleting it. Select countries
                                where you want to ship for this zone.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <LegacyCard sectioned>
                            <div className='choice'>
                                <ChoiceList
                                    title="Zone Status"
                                    choices={[
                                        { label: 'Enable', value: 'enable' },
                                        { label: 'Disable', value: 'disable' },
                                    ]}
                                    selected={selected}
                                    onChange={handleChange}
                                />
                            </div>
                            <div style={{ marginTop: "2%" }} className='zonetext'>
                                <TextField
                                    type="text"
                                    label="Name"
                                    placeholder="Name"
                                    value={formData.name}
                                    onChange={handleConfigrationSettings('name')}
                                    error={formErrors.name}
                                />                            </div>
                            <div style={{ marginTop: "2%" }} className='zonetext'>

                                <Select
                                    label="Country"
                                    options={country}
                                    onChange={handleConfigrationSettings('country')}
                                    value={formData.country}
                                />
                            </div>
                            <div style={{ marginTop: "2%", marginBottom: "2%" }} className='zonetext'>
                                <Select
                                    label="Currency"
                                    options={currencys}
                                    onChange={handleConfigrationSettings('currency')}
                                    value={formData.currency}

                                />
                            </div>
                        </LegacyCard>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>

                </Grid>
            </div>
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '2%' }}>
                            <Text variant="headingLg" as="h5">
                                Specify rates
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Specify shipping rates for this particular zone.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <FormLayout>
                            <FormLayout.Group>
                                <TextField
                                    type="text"
                                    placeholder='Rate Name/ Service Code'
                                    autoComplete="off"
                                />
                                <Select
                                    options={options}
                                    onChange={handleSelectChange}
                                    value={select}
                                />
                            </FormLayout.Group>
                        </FormLayout>
                        <div style={{ marginTop: "2%", float: 'right' }}>
                            <ButtonGroup>
                                {/* <Button variant="primary" icon={ResetIcon} /> */}
                                <Button variant="primary" icon={SearchIcon} />
                                <Button variant="primary" onClick={() => handleEditForm()}>Add Rate</Button>
                            </ButtonGroup>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "5%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 10, sm: 3, md: 3, lg: 10, xl: 10 }}>
                        {/* <Card>
                            <div style={{ textAlign: "center", paddingTop: "5%", paddingBottom: "5%", textDecoration: "none" }}>
                                <Link onClick={() => handleEditForm()}> Click Here</Link> to add rate for this particular zone.
                            </div>
                        </Card> */}
                        <LegacyCard>
                            <IndexTable
                                resourceName={resourceName}
                                itemCount={orders.length}
                                selectedItemsCount={
                                    allResourcesSelected ? 'All' : selectedResources.length
                                }
                                onSelectionChange={handleSelectionChange}
                                headings={[
                                    { title: 'Order' },
                                    { title: 'Date' },
                                    { title: 'Customer' },
                                    { title: 'Total', alignment: 'end' },
                                    
                                ]}
                            >
                                {rowMarkup}
                            </IndexTable>
                        </LegacyCard>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>
            {showToast && (
                <Toast content={toastContent} duration={toastDuration} onDismiss={() => setShowToast(false)} />
            )}
        </Page>
    );
}

export default Help;
