import React, { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Page,
    Button,
    LegacyCard,
    Divider,
    Grid,
    Text,
    TextField,
    Checkbox,
    Toast,
    SkeletonBodyText,
    SkeletonDisplayText,
    Card,
    RadioButton,
    Select,
    Autocomplete,
    LegacyStack,
    Tag,
    FormLayout,
    DatePicker,
    Layout,
} from '@shopify/polaris';
import { DeleteIcon, PlusIcon } from '@shopify/polaris-icons';
import '../../../public/css/style.css';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
import '../../../public/css/style.css';

const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function Rate(props) {
    const { rate_id, zone_id } = useParams();
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState([])
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [zipcodeValue, setZipcodeValue] = useState('');
    const navigate = useNavigate();
    const [checkstate, setCheckState] = useState({
        selectedCondition: 0,
        selectedStateCondition: 'All',
        selectedByCart: 'weight',
        selectedByschedule: 'No',
        selectedByAmount: 'unit',
        selectedByUpdatePriceType: 'Fixed',
        selectedByUpdatePriceEffect: 'increase',
        selectedZipCondition: 'All',
        selectedZipCode: 'include',
        selectedMultiplyLine: 'Yes'
    });
    const handlecheckedChange = (key, value) => {
        setCheckState(prevState => ({ ...prevState, [key]: value }));
    };
    const [toastDuration, setToastDuration] = useState(3000);
    const [showToast, setShowToast] = useState(false);
    const [toastContent, setToastContent] = useState("");
    const [errors, setErrors] = useState({});
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [locations, setLocations] = useState([]);

    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);

    const handleMonthChange = useCallback((month, year) => {
        setMonth(month);
        setYear(year);
    }, []);
    const handleStartDateChange = useCallback((selectedDate) => {
        setStartDate(selectedDate.start);
        setIsStartDatePickerVisible(false);
    }, []);
    const handleEndDateChange = useCallback((selectedDate) => {
        setEndDate(selectedDate.start);
        setIsEndDatePickerVisible(false);
    }, []);

    let app = "";

    const [checkedState, setCheckedState] = useState({
        checked1: false,
        checked2: true,
        checked3: false
    });

    const handleCheckChange = (checkbox) => {
        setCheckedState({
            ...checkedState,
            [checkbox]: !checkedState[checkbox]
        });
    };

    const handleChange = useCallback((value) => {
        setZipcodeValue(value);
    }, []);

    const editRate = async () => {
        try {
            const token = await getSessionToken(app);

            const response = await axios.get(`${apiCommonURL}/api/rate/${rate_id}/edit`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const allStates = response.data.states;
            const formattedOptions = [];

            for (const country in allStates) {
                if (allStates.hasOwnProperty(country)) {
                    const countryData = allStates[country];

                    const stateOptions = countryData.map(state => ({
                        value: state.code,
                        label: `${state.name} (${state.code})`
                    }));
                    formattedOptions.push({
                        title: country,
                        options: stateOptions
                    });
                }
            }

            setOptions(formattedOptions);
            setState(formattedOptions.map(section => section.options).flat());
            if (response.data.rate.zipcode) {
                const zipCodes = response.data.rate.zipcode.zipcode?.map(zip => zip.toString()) || [];
                const combinedZipCodes = zipCodes.join(',');
                setZipcodeValue(combinedZipCodes);

                setCheckState(prevState => ({
                    ...prevState,
                    selectedZipCondition: response.data.rate.zipcode.zipcodeSelection,
                    selectedStateCondition: response.data.rate.zipcode.stateSelection,
                    selectedZipCode: response.data.rate.zipcode.isInclude,
                }));
            }
            if (response.data.rate.zipcode.state) {
                const fetchedSelectedOptions = response.data.rate.zipcode.state.map(state => state.code);
                setSelectedOptions(fetchedSelectedOptions);
            }

            if (response.data.rate.cart_condition) {
                setCheckState(prevState => ({
                    ...prevState,
                    selectedCondition: response.data.rate.cart_condition.conditionMatch,
                }));
                setItems(response.data.rate.cart_condition.cartCondition)
            }
            setFormData({
                name: response.data.rate.name,
                base_price: response.data.rate.base_price,
                service_code: response.data.rate.service_code,
                description: response.data.rate.description,
                id: response.data.rate.id,
                zone_id: response.data.rate.zone_id,
                status: response.data.rate.status,
            });

            // setLoading(false); 

        } catch (error) {
            console.error("Error fetching edit data:", error);
        }
    };


    const getLocation = async () => {
        try {
            const token = await getSessionToken(app);

            const response = await axios.get(`${apiCommonURL}/api/shop/location`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setLocations(response.data.locations);

        } catch (error) {
            console.error("Error fetching shop location:", error);
        }
    };

    const getProduct = async () => {
        try {
            const token = await getSessionToken(app);
            console.log(token)
            const response = await axios.post(`${apiCommonURL}/api/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setLocations(response.data.locations);

        } catch (error) {
            console.error("Error fetching Products", error);
        }
    };

    const getstate = async () => {
        try {
            const token = await getSessionToken(app);


            const response = await axios.get(`${apiCommonURL}/api/rate/${zone_id}/create`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const allStates = response.data.states;
            const formattedOptions = [];

            for (const country in allStates) {
                if (allStates.hasOwnProperty(country)) {
                    const countryData = allStates[country];

                    const stateOptions = countryData.map(state => ({
                        value: state.code,
                        label: `${state.name} (${state.code})`
                    }));

                    formattedOptions.push({
                        title: country,
                        options: stateOptions
                    });
                }
            }
            setOptions(formattedOptions);
            setState(formattedOptions.map(section => section.options).flat());

        } catch (error) {
            console.error("Error fetching shop location:", error);
        }
    };
    useEffect(() => {
        editRate();
        getLocation();
        getstate();
        getProduct()

    }, []);

    const updateText = useCallback(
        (value) => {
            setInputValue(value);

            if (value === '') {
                setOptions(options);
                return;
            }

            const filterRegex = new RegExp(value, 'i');
            const resultOptions = [];

            options.forEach((opt) => {
                const filteredOptions = opt.options.filter((option) =>
                    option.label.match(filterRegex),
                );

                resultOptions.push({
                    title: opt.title,
                    options: filteredOptions,
                });
            });

            setOptions(resultOptions);
        },
        [options],
    );

    const removeTag = useCallback(
        (tag) => () => {
            const newSelectedOptions = selectedOptions.filter(option => option !== tag);
            setSelectedOptions(newSelectedOptions);
        },
        [selectedOptions],
    );

    const verticalContentMarkup =
        selectedOptions.length > 0 ? (
            <LegacyStack spacing="extraTight" alignment="center">
                {selectedOptions.map((option) => {
                    const tagLabel = state.find(opt => opt.value === option)?.label || option;
                    return (
                        <Tag key={option} onRemove={removeTag(option)}>
                            {tagLabel}
                        </Tag>
                    );
                })}
            </LegacyStack>
        ) : null;

    const textField = (
        <Autocomplete.TextField
            onChange={updateText}
            value={inputValue}
            placeholder="Search State"
            verticalContent={verticalContentMarkup}
            autoComplete="off"
        />
    );
    const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);
    const handleStatusChange = useCallback(
        (newStatus) => {
            const statusValue = newStatus === 'Enabled' ? 1 : 0;
            setFormData((prevState) => ({
                ...prevState,
                status: statusValue,
            }));
        },
        [],
    );

    const statusOptions = [
        { label: 'Enabled', value: 'Enabled' },
        { label: 'Disabled', value: 'Disabled' },
    ];
    const handleRateFormChange = (field) => (value) => {
        setFormData((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };

    const [items, setItems] = useState([
        { name: 'quantity', condition: 'equal', value: '', unit: 'items' }
    ]);

    const handleSelectChange = (index, newValue, isSecondSelect) => {
        const selectedOption = validations.find(option => option.value === newValue) || {};
        const updatedItem = {
            ...items[index],
            name: isSecondSelect ? items[index].name : newValue,
            condition: isSecondSelect ? newValue : items[index].condition,
            unit: selectedOption.unit || items[index].unit || '',
        };

        const updatedItems = [...items];
        updatedItems[index] = updatedItem;


        handleSelectChange
        setItems(updatedItems);
    };

    const handleAddItem = () => {
        const newItem = { name: 'quantity', condition: 'equal', value: '', unit: 'items' };
        setItems([...items, newItem]);
    };

    const handleConditionChange = useCallback(
        (newValue, index) => {
            setItems(prevItems => {
                return prevItems.map((item, idx) => {
                    if (idx === index) {
                        return { ...item, value: newValue };
                    }
                    return item;
                });
            });
        },
        []
    );

    const handleDeleteItem = (index) => {
        const updatedItems = items.filter((item, i) => i !== index);
        setItems(updatedItems);
    };
    const BacktoZone = (zone_id) => {
        navigate(`/Zone/${zone_id}`);
    };
    useEffect(() => {
        app = createApp({
            apiKey: SHOPIFY_API_KEY,
            host: props.host,
        });
    }, []);
    const validations = [
        { label: 'Cart / Order', value: '', disabled: true, className: 'select-header' },
        { label: 'Quantity', value: 'quantity', unit: 'items' },
        { label: 'Total', value: 'total', unit: '.Rs' },
        { label: 'Sale Product Total', value: 's&ptotal', unit: '.Rs' },
        { label: 'Non Sale Product Total', value: 'ns&ptotal', unit: '.Rs' },
        { label: 'Weight', value: 'weight', unit: 'kg' },
        { label: 'Line Item', value: 'lineitem' },
        { label: 'Distance', value: 'distance', unit: 'km' },
        { label: 'Day', value: 'day' },
        { label: 'Time', value: 'time' },
        { label: 'Local Code', value: 'localcode' },

        { label: 'Per Product', value: '', disabled: true, className: 'select-header' },
        { label: 'Quantity', value: 'quantity2' },
        { label: 'Price', value: 'price' },
        { label: 'Total', value: 'total2' },
        { label: 'Weight', value: 'weight2' },
        { label: 'Name', value: 'name' },
        { label: 'Tag', value: 'tag' },
        { label: 'SKU', value: 'sku' },
        { label: 'Type', value: 'type' },
        { label: 'Vendor', value: 'vendor' },
        { label: 'Properties', value: 'properties' },

        { label: 'Customer', value: '', disabled: true, className: 'select-header' },
        { label: 'Name', value: 'name2' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Compnay', value: 'company' },
        { label: 'Address', value: 'address' },
        { label: 'Address1', value: 'addrss1' },
        { label: 'Address2', value: 'address2' },
        { label: 'City', value: 'city' },
        { label: 'Province COde', value: 'provinceCode' },
        { label: 'Tag', value: 'tag2' },
        { label: 'Previous Orders Count', value: 'previousCount' },
        { label: 'Previous Orders Spent ', value: 'previousSpent' },

        { label: 'Delivery', value: '', disabled: true, className: 'select-header' },
        { label: 'Day Of Week', value: 'dayOfWeek' },
        { label: 'Day Is', value: 'dayIs' },
        { label: 'Date', value: 'date' },
        { label: 'Time In', value: 'timeIn' },
        { label: 'Type', value: 'type2' }
    ];


    const option = [
        { label: 'Equal', value: 'equal' },
        { label: 'Does Not Eqaul', value: 'notequal' },
        { label: 'Greatre then or Eqaul', value: 'gthenoequal' },
        { label: 'Less then or Eqaul', value: 'lthenoequal' },
        { label: 'Between', value: 'between' },
    ];



    const [formData, setFormData] = useState({
        name: '',
        base_price: '',
        service_code: '',
        description: '',
        zone_id: zone_id,
        id: "",
        zipcode: {
            stateSelection: "All",
            state: [],
            zipcodeSelection: "All",
            zipcode: []

        },
        cart_condition: {
            conditionMatch: checkstate.selectedCondition,
            cartCondition: items
        },
        status: 1,
        tag: ''
    });
    useEffect(() => {
        const selectedStates = selectedOptions.map(option => ({
            name: state.find(state => state.value === option)?.label || '',
            code: option
        }));

        setFormData(prevFormData => ({
            ...prevFormData,
            cart_condition: {
                ...prevFormData.cart_condition,
                conditionMatch: checkstate.selectedCondition,
                cartCondition: items,
            },
            zipcode: {
                ...prevFormData.zipcode,
                state: selectedStates,
                stateSelection: checkstate.selectedStateCondition,
                zipcodeSelection: checkstate.selectedZipCondition,
                isInclude: checkstate.selectedZipCode,
                zipcode: zipcodeValue.split(',').map(zip => zip.trim())
            }
        }));
    }, [selectedOptions, items, zipcodeValue, checkstate.selectedCondition, checkstate.selectedStateCondition, checkstate.selectedZipCondition, checkstate.selectedZipCode, state]);


    const saveRate = async () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Rate name is required';
        if (!formData.base_price) newErrors.base_price = 'Base price is required';
        if (!formData.service_code) newErrors.service_code = 'Service code is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        try {
            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);


            const response = await axios.post(`${apiCommonURL}/api/rate/save`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setToastContent("Rate saved successfully");
            setShowToast(true);
        } catch (error) {
            console.error('Error occurs', error);
            setToastContent("Error occurred while saving data");
            setShowToast(true);
        }
    };



    if (loading) {
        return (
            <Page
                fullWidth
                title={rate_id ? 'Edit Rate' : 'Add Rate'}
                primaryAction={<Button variant="primary" onClick={saveRate}>Save</Button>}
                secondaryActions={<Button onClick={BacktoZone}>Back</Button>}
            >
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '18%' }}>
                            <SkeletonDisplayText size="small" />
                            <div style={{ paddingTop: '7%', fontSize: '14px' }}>
                                <SkeletonBodyText lines={2} />
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                            <Card roundedAbove="sm">
                                <div style={{ marginTop: "2%", }}>
                                    <LegacyCard sectioned>
                                        <SkeletonBodyText lines={2} />
                                    </LegacyCard>
                                </div>
                                <div style={{ marginTop: "2%", }}>
                                    <LegacyCard sectioned>
                                        <SkeletonBodyText lines={2} />
                                    </LegacyCard>
                                </div>
                                <div style={{ marginTop: "2%", }}>
                                    <LegacyCard sectioned>
                                        <SkeletonBodyText lines={2} />
                                    </LegacyCard>
                                </div>
                                <div style={{ marginTop: "2%", }}>
                                    <LegacyCard sectioned>
                                        <SkeletonBodyText lines={2} />
                                    </LegacyCard>
                                </div>
                            </Card>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </Page>
        );
    }
    return (
        <Page

            title={rate_id ? 'Edit Rate' : 'Add Rate'}
            primaryAction={<Button variant="primary" onClick={saveRate}>Save</Button>}
            secondaryActions={<Button onClick={() => BacktoZone(zone_id)}>Back</Button>}
        >
            <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                <Layout>
                    <Layout.Section variant="oneThird">
                        <div style={{ paddingTop: '10%' }}>
                            <Text variant="headingLg" as="h5">
                                Rate details
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Specify which rates should apply in this zone
                            </p>
                        </div>
                    </Layout.Section>
                    <Layout.Section>
                        <LegacyCard sectioned>
                            <div style={{ marginBottom: "2%" }}>
                                <Select
                                    label="Rate status"
                                    options={statusOptions}
                                    onChange={handleStatusChange}
                                    value={formData.status === 1 ? 'Enabled' : 'Disabled'}
                                />
                            </div>
                            <Divider borderColor="border" />
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Rate Name"
                                    placeholder="Rate Name"
                                    autoComplete="off"
                                    value={formData.name}
                                    onChange={handleRateFormChange('name')}
                                    error={errors.name}
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Base price"
                                    placeholder="0.00"
                                    autoComplete="off"
                                    prefix="Rs."
                                    value={formData.base_price}
                                    onChange={handleRateFormChange('base_price')}
                                    error={errors.base_price}
                                />
                            </div>
                            <div style={{ marginTop: '2%', marginBottom: '2%' }} className='zonetext'>
                                <TextField
                                    label="Service code"
                                    placeholder="Service code"
                                    autoComplete="off"
                                    value={formData.service_code}
                                    onChange={handleRateFormChange('service_code')}
                                    helpText="The service service_code should not be the same as the other rates."
                                    error={errors.service_code}
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Description"
                                    placeholder="Enter Description"
                                    autoComplete="off"
                                    value={formData.description}
                                    onChange={handleRateFormChange('description')}
                                    error={errors.description}
                                />
                            </div>
                        </LegacyCard>
                    </Layout.Section>
                </Layout>
            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '10%' }}>
                            <Text variant="headingLg" as="h5">
                                Conditions
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                New Condition Scenario
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: "2%", }}>
                                <Text variant="headingXs" as="h6">
                                    Condition match
                                </Text>
                                <RadioButton
                                    label="Not Any Condition"
                                    checked={checkstate.selectedCondition === 0}
                                    id="notAny"
                                    name="conditionMatch"
                                    onChange={() => handlecheckedChange('selectedCondition', 0)}
                                />
                                <RadioButton
                                    label="All"
                                    checked={checkstate.selectedCondition === 1}
                                    id="AllCondition"
                                    name="conditionMatch"
                                    onChange={() => handlecheckedChange('selectedCondition', 1)}
                                />
                                <RadioButton
                                    label="Any"
                                    checked={checkstate.selectedCondition === 2}
                                    id="Any"
                                    name="conditionMatch"
                                    onChange={() => handlecheckedChange('selectedCondition', 2)}
                                />
                                <RadioButton
                                    label="NOT All"
                                    checked={checkstate.selectedCondition === 3}
                                    id="notAll"
                                    name="conditionMatch"
                                    onChange={() => handlecheckedChange('selectedCondition', 3)}
                                />

                            </div>
                            {checkstate.selectedCondition !== 0 && (
                                <div>
                                    <Divider borderColor="border" />
                                    {items.map((item, index) => (
                                        <div key={index} className='conditions' style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: "2%",
                                            marginTop: "2%",
                                        }}>
                                            <Text variant="headingXs" as="h6">
                                                Cart / Order
                                            </Text>
                                            <Select
                                                options={validations}
                                                onChange={(newValue) => handleSelectChange(index, newValue, false)}
                                                value={item.name}
                                            />
                                            <Select
                                                options={option}
                                                onChange={(newValue) => handleSelectChange(index, newValue, true)}
                                                value={item.condition}
                                            />
                                            <TextField
                                                value={item.value}
                                                onChange={(newValue) => handleConditionChange(newValue, index)}
                                                autoComplete="off"
                                                suffix={item.unit ? item.unit : ''}
                                            />
                                            {items.length > 1 && (
                                                <Divider borderColor="border-inverse" />
                                            )}

                                            {items.length > 1 && (
                                                <Button
                                                    icon={DeleteIcon}
                                                    variant='primary'
                                                    tone="critical"
                                                    accessibilityLabel="Delete item"
                                                    onClick={() => handleDeleteItem(index)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <Divider borderColor="border" />

                                    <div style={{ marginTop: "2%" }}>
                                        <Button
                                            icon={PlusIcon}
                                            variant='primary'
                                            onClick={handleAddItem}
                                        >
                                            Add theme
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </LegacyCard>
                    </Grid.Cell>
                </Grid>
            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%", }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '7%' }}>
                            <Text variant="headingLg" as="h5">
                                Set State/ZipCode
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                No need to add All ZipCode if you select states.
                            </p>
                            <p style={{ paddingTop: '1%', fontSize: '14px' }}>
                                If you want to exclude the specific Zipcode from that state then you can use exclude ZipCode on Allow Zipcode settings.
                            </p>

                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>

                            <div>
                                {state.length > 0 && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2%', paddingTop: '2%' }}>
                                            <Text variant="headingXs" as="h6">
                                                State Selection
                                            </Text>
                                            <RadioButton
                                                label="Custom"
                                                checked={checkstate.selectedStateCondition === 'Custom'}
                                                id="Custom"
                                                name="stateSelection"
                                                onChange={() => handlecheckedChange('selectedStateCondition', 'Custom')}
                                            />
                                            <RadioButton
                                                label="All"
                                                checked={checkstate.selectedStateCondition === 'All'}
                                                id="All"
                                                name="stateSelection"
                                                onChange={() => handlecheckedChange('selectedStateCondition', 'All')}
                                            />
                                        </div>

                                        {checkstate.selectedStateCondition !== 'All' && (
                                            <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                                                <Autocomplete
                                                    allowMultiple
                                                    options={options}
                                                    selected={selectedOptions}
                                                    textField={textField}
                                                    onSelect={setSelectedOptions}
                                                    listTitle="Suggested Countries"
                                                />
                                            </div>
                                        )}

                                        <Divider borderColor="border" />
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: "2%", }}>
                                <Text variant="headingXs" as="h6">
                                    ZipCode
                                </Text>
                                <RadioButton
                                    label="Custom"
                                    checked={checkstate.selectedZipCondition === 'Custom'}
                                    id="customeZip"
                                    name="zipcodeSelection"
                                    onChange={() => handlecheckedChange('selectedZipCondition', 'Custom')}
                                />
                                <RadioButton
                                    label="All"
                                    checked={checkstate.selectedZipCondition === 'All'}
                                    id="AllZip"
                                    name="zipcodeSelection"
                                    onChange={() => handlecheckedChange('selectedZipCondition', 'All')}
                                />

                            </div>
                            {checkstate.selectedZipCondition !== 'All' && (
                                <div style={{ marginTop: "2%" }}>

                                    <TextField
                                        placeholder='364001,364002,364003'
                                        value={zipcodeValue}
                                        onChange={(newValue) => handleChange(newValue)}
                                        multiline={4}
                                        autoComplete="off"
                                    />

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: "2%" }}>
                                        <RadioButton
                                            label="Include ZipCodes"
                                            checked={checkstate.selectedZipCode === 'Include'}
                                            id="include"
                                            name="isInclude"
                                            onChange={() => handlecheckedChange('selectedZipCode', 'Include')}
                                        />
                                        <RadioButton
                                            label="Exclude ZipCodes"
                                            checked={checkstate.selectedZipCode === 'Exclude'}
                                            id="exclude"
                                            name="isInclude"
                                            onChange={() => handlecheckedChange('selectedZipCode', 'Exclude')}
                                        />
                                    </div>
                                </div>
                            )}
                        </LegacyCard>
                    </Grid.Cell>
                </Grid>
            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%", }}>
                <Grid>

                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '7%' }}>
                            <Text variant="headingLg" as="h5">
                                Rate Based On/Surcharge
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Specify rate calculation based on Order Weight, Order Quantity with surcharge value.
                            </p>
                            <p style={{ paddingTop: '1%', fontSize: '14px' }}>
                                Surcharge calculation will add on Base Price which is available on top of the page.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <Checkbox
                                label="Based On Cart"
                                checked={checkedState.checked1}
                                onChange={() => handleCheckChange('checked1')}
                            />
                            {!checkedState.checked1 && (
                                <div style={{ marginTop: "2%" }}>
                                    <Divider borderColor="border" />
                                    <div style={{ marginBottom: "2%" }}></div>
                                    <Text variant="headingSm" as="h6">
                                        By Cart Surcharge
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '30%', paddingTop: '1%' }}>
                                        <RadioButton
                                            label="Item Weight"
                                            checked={checkstate.selectedByCart === 'weight'}
                                            id="weight"
                                            name="weight"
                                            onChange={() => handlecheckedChange('selectedByCart', 'weight')}
                                        />
                                        <RadioButton
                                            label="Item Qty"
                                            checked={checkstate.selectedByCart === 'Qty'}
                                            id="Qty"
                                            name="Qty"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Qty')}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '21.5%', marginBottom: "2%" }}>
                                        <RadioButton
                                            label="Cart Total Percentage"
                                            checked={checkstate.selectedByCart === 'Percentage'}
                                            id="Percentage"
                                            name="Percentage"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Percentage')}
                                        />
                                        <RadioButton
                                            label="Based On Distance"
                                            checked={checkstate.selectedByCart === 'Distance'}
                                            id="Distance"
                                            name="Distance"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Distance')}
                                        />
                                    </div>
                                    {checkstate.selectedByCart === 'Distance' && (
                                        <div>
                                            <p style={{ color: 'gray', fontSize: "13px" }}> Note: Please make sure Origin and Destination country must be same to use distance base shipping rate.</p>
                                        </div>
                                    )}
                                    <div style={{ marginBottom: "3%" }}></div>
                                    <Text variant="headingSm" as="h6">
                                        By Product Surcharge
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '35.5%', paddingTop: '1%' }}>
                                        <RadioButton
                                            label="Product"
                                            checked={checkstate.selectedByCart === 'Product'}
                                            id="Product"
                                            name="Product"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Product')}
                                        />
                                        <RadioButton
                                            label="Vendor"
                                            checked={checkstate.selectedByCart === 'Vendor'}
                                            id="Vendor"
                                            name="Vendor"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Vendor')}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '36.5%' }}>
                                        <RadioButton
                                            label="Variant"
                                            checked={checkstate.selectedByCart === 'Variant'}
                                            id="Variant"
                                            name="Variant"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Variant')}
                                        />
                                        <RadioButton
                                            label="Product Tag"
                                            checked={checkstate.selectedByCart === 'Tag'}
                                            id="Tag"
                                            name="Tag"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Tag')}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '30.8%' }}>
                                        <RadioButton
                                            label="Product Type"
                                            checked={checkstate.selectedByCart === 'Type'}
                                            id="Type"
                                            name="Type"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Type')}
                                        />
                                        <RadioButton
                                            label="Product SKU"
                                            checked={checkstate.selectedByCart === 'SKU'}
                                            id="SKU"
                                            name="SKU"
                                            onChange={() => handlecheckedChange('selectedByCart', 'SKU')}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '23.5%' }}>
                                        <RadioButton
                                            label="Product Collection Id"
                                            checked={checkstate.selectedByCart === 'Collection'}
                                            id="Collection"
                                            name="Collection"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Collection')}
                                        />
                                        <RadioButton
                                            label="Variant Metafields"
                                            checked={checkstate.selectedByCart === 'Metafields'}
                                            id="Metafields"
                                            name="Metafields"
                                            onChange={() => handlecheckedChange('selectedByCart', 'Metafields')}
                                        />
                                    </div>

                                    <div style={{ marginBottom: "2%" }}></div>
                                    <Divider borderColor="border-inverse" />
                                    <div style={{ marginTop: "3%" }}></div>
                                    {checkstate.selectedByCart === 'weight' && (
                                        <div >
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Charge Per Weight"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0.00'
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Unit For Weight"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="kg"
                                                        placeholder='5.00'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                            <div style={{ marginTop: "4%" }}></div>
                                            <Text variant="headingSm" as="h6">
                                                By Product Surcharge:
                                            </Text>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10%', paddingTop: '1%', marginBottom: "4%" }}>
                                                <RadioButton
                                                    label="Divided by each unit"
                                                    checked={checkstate.selectedByAmount === 'unit'}
                                                    id="unit"
                                                    name="unit"
                                                    onChange={() => handlecheckedChange('selectedByAmount', 'unit')}
                                                />
                                                <RadioButton
                                                    label="Surcharge add by every more then unit"
                                                    checked={checkstate.selectedByAmount === 'units'}
                                                    id="units"
                                                    name="units"
                                                    onChange={() => handlecheckedChange('selectedByAmount', 'units')}
                                                />
                                            </div>
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Minimum Charge Price"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Maximum Charge Price"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                        </div>
                                    )}
                                    {checkstate.selectedByCart === 'Qty' && (
                                        <div >
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Charge Per Qty"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0.00'
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Unit For Qty"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Qty"
                                                        placeholder='0'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                            <div style={{ marginTop: "4%" }}></div>
                                            <Text variant="headingSm" as="h6">
                                                By Product Surcharge:
                                            </Text>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10%', paddingTop: '1%', marginBottom: "4%" }}>
                                                <RadioButton
                                                    label="Divided by each unit"
                                                    checked={checkstate.selectedByAmount === 'unit'}
                                                    id="unit"
                                                    name="unit"
                                                    onChange={() => handlecheckedChange('selectedByAmount', 'unit')}
                                                />
                                                <RadioButton
                                                    label="Surcharge add by every more then unit"
                                                    checked={checkstate.selectedByAmount === 'units'}
                                                    id="units"
                                                    name="units"
                                                    onChange={() => handlecheckedChange('selectedByAmount', 'units')}
                                                />
                                            </div>
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Minimum Charge Price"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Maximum Charge Price"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                        </div>
                                    )}
                                    {checkstate.selectedByCart === 'Percentage' && (
                                        <div >
                                            <FormLayout>
                                                <TextField
                                                    type="text"
                                                    label="Cart Total Percentage"
                                                    onChange={() => { }}
                                                    autoComplete="off"
                                                    prefix="%"
                                                    placeholder='0.00'
                                                />
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Charge Per Weight"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Unit For Weight"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="kg"
                                                        placeholder='0'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                        </div>
                                    )}
                                    {checkstate.selectedByCart === 'Distance' && (
                                        <div >
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Charge Per Distance"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0.00'
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Unit For Distance"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="km"
                                                        placeholder='0'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                            <div style={{ marginTop: "4%" }}></div>
                                            <Text variant="headingSm" as="h6">
                                                By Product Surcharge:
                                            </Text>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10%', paddingTop: '1%', marginBottom: "4%" }}>
                                                <RadioButton
                                                    label="Divided by each unit"
                                                    checked={checkstate.selectedByAmount === 'unit'}
                                                    id="unit"
                                                    name="unit"
                                                    onChange={() => handlecheckedChange('selectedByAmount', 'unit')}
                                                />
                                                <RadioButton
                                                    label="Surcharge add by every more then unit"
                                                    checked={checkstate.selectedByAmount === 'units'}
                                                    id="units"
                                                    name="units"
                                                    onChange={() => handlecheckedChange('selectedByAmount', 'units')}
                                                />
                                            </div>
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Minimum Charge Price"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Maximum Charge Price"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                        </div>
                                    )}
                                    {checkstate.selectedByCart === 'Variant' && (
                                        <div>
                                            <Text variant="headingMd" as="h6">
                                                You can select variant for this rate after save
                                            </Text>
                                            <div style={{ marginTop: "3%", marginBottom: "5%" }}>
                                                <Button variant="primary" >Click Here</Button>

                                            </div>

                                        </div>
                                    )}
                                    {checkstate.selectedByCart === 'Product' && (
                                        <div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5%' }}>
                                                <Text variant="headingSm" as="h6">
                                                    Multiply line item QTY price:
                                                </Text>
                                                <RadioButton
                                                    label="Yes"
                                                    checked={checkstate.selectedMultiplyLine === 'Yes'}
                                                    id="Yes"
                                                    name="Yes"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'Yes')}
                                                />
                                                <RadioButton
                                                    label="No"
                                                    checked={checkstate.selectedMultiplyLine === 'no'}
                                                    id="no"
                                                    name="SKU"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'no')}
                                                />
                                                <RadioButton
                                                    label="Percentage"
                                                    checked={checkstate.selectedMultiplyLine === 'pr'}
                                                    id="pr"
                                                    name="pr"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'pr')}
                                                />
                                            </div>


                                            {checkstate.selectedMultiplyLine !== 'no' && (
                                                <div style={{ marginTop: "4%" }}>
                                                    <Divider borderColor="border" />

                                                    {checkstate.selectedMultiplyLine === 'pr' && (
                                                        <div style={{ marginTop: "2%" }}>
                                                            <TextField
                                                                type="text"
                                                                label="Cart Total Percentage"
                                                                onChange={() => { }}
                                                                autoComplete="off"
                                                                placeholder='0.00'
                                                                prefix='%'
                                                            />

                                                            <div style={{ marginTop: "2%", marginBottom: "3%" }}>
                                                                <FormLayout>
                                                                    <FormLayout.Group>
                                                                        <TextField
                                                                            type="text"
                                                                            label="Minimum Charge Price"
                                                                            onChange={() => { }}
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                        />
                                                                        <TextField
                                                                            type="text"
                                                                            label="Maximum Charge Price"
                                                                            onChange={() => { }}
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                        />
                                                                    </FormLayout.Group>
                                                                </FormLayout>
                                                            </div>

                                                            <Divider borderColor="border" />

                                                        </div>
                                                    )}


                                                    <div style={{ marginTop: "2%" }}>
                                                        <FormLayout>
                                                            <FormLayout.Group>
                                                                <TextField
                                                                    type="text"
                                                                    label="Full Product Title"
                                                                    onChange={() => { }}
                                                                    autoComplete="off"
                                                                    placeholder='Enter Full Product Title'
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Enter Collection ID"
                                                                    onChange={() => { }}
                                                                    autoComplete="off"
                                                                    placeholder='Enter Collection ID'
                                                                />
                                                            </FormLayout.Group>
                                                        </FormLayout>
                                                    </div>
                                                    <div style={{ marginTop: "2%" }}>
                                                        <FormLayout>
                                                            <FormLayout.Group>
                                                                <TextField
                                                                    type="text"
                                                                    label="Full Product Type"
                                                                    onChange={() => { }}
                                                                    autoComplete="off"
                                                                    placeholder='Enter Full Product Type'
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Full Product Vendor"
                                                                    onChange={() => { }}
                                                                    autoComplete="off"
                                                                    placeholder='Enter Full Product Vendor'
                                                                />
                                                            </FormLayout.Group>
                                                        </FormLayout>
                                                    </div>
                                                    <p style={{ marginTop: "2%" }}>Note: Please enter the exact term for product title, collection id, product type, and product vendor that needs to be searched.
                                                    </p>
                                                    <div style={{ marginTop: "2%", width: '20%' }}>
                                                        <Button variant="primary" >Search Product</Button></div>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                    {checkstate.selectedByCart === 'Vendor' && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5%' }}>
                                                <Text variant="headingSm" as="h6">
                                                    Multiply line item QTY price:
                                                </Text>
                                                <RadioButton
                                                    label="Yes"
                                                    checked={checkstate.selectedMultiplyLine === 'Yes'}
                                                    id="Yes"
                                                    name="Yes"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'Yes')}
                                                />
                                                <RadioButton
                                                    label="No"
                                                    checked={checkstate.selectedMultiplyLine === 'no'}
                                                    id="no"
                                                    name="SKU"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'no')}
                                                />
                                                <RadioButton
                                                    label="Percentage"
                                                    checked={checkstate.selectedMultiplyLine === 'pr'}
                                                    id="pr"
                                                    name="pr"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'pr')}
                                                />
                                            </div>

                                            {checkstate.selectedMultiplyLine !== 'no' && (
                                                <div style={{ marginTop: "4%" }}>
                                                    <Divider borderColor="border" />

                                                    {checkstate.selectedMultiplyLine === 'pr' && (
                                                        <div style={{ marginTop: "2%" }}>
                                                            <TextField
                                                                type="text"
                                                                label="Cart Total Percentage"
                                                                onChange={() => { }}
                                                                autoComplete="off"
                                                                placeholder='0.00'
                                                                prefix='%'
                                                            />

                                                            <div style={{ marginTop: "2%", marginBottom: "3%" }}>
                                                                <FormLayout>
                                                                    <FormLayout.Group>
                                                                        <TextField
                                                                            type="text"
                                                                            label="Minimum Charge Price"
                                                                            onChange={() => { }}
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                        />
                                                                        <TextField
                                                                            type="text"
                                                                            label="Maximum Charge Price"
                                                                            onChange={() => { }}
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                        />
                                                                    </FormLayout.Group>
                                                                </FormLayout>
                                                            </div>

                                                            <Divider borderColor="border" />

                                                        </div>
                                                    )}


                                                    <div style={{ marginTop: "2%" }}>
                                                        <TextField
                                                            type="text"
                                                            label="Vendor Name  "
                                                            onChange={() => { }}
                                                            autoComplete="off"
                                                            placeholder='Enter Multiple vendor Name with Comma Seprate(,)'
                                                            multiline={4}
                                                            monospaced
                                                            helpText='Note: Please enter the exact term of multiple Vendor Name with comma separator(,).'
                                                        />
                                                    </div>



                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            )}

                        </LegacyCard>
                    </Grid.Cell>
                </Grid>
            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '5%' }}>
                            <Text variant="headingLg" as="h5">
                                Merge rate
                            </Text>
                            <p style={{ paddingTop: '5%', fontSize: '14px' }}>
                                We recommend using the same Shipping Tag for all related Shipping rates when merge shipping rates.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <TextField
                                label="Merge rate tag"
                                value={formData.tag}
                                onChange={handleRateFormChange('tag')}
                                autoComplete="off"
                                placeholder='tag1,tag2,tag3'
                            />
                        </LegacyCard>
                    </Grid.Cell>
                </Grid>

            </div>


            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '5%' }}>
                            <Text variant="headingLg" as="h5">
                                Origin Locations
                            </Text>
                            <p style={{ paddingTop: '5%', fontSize: '14px' }}>
                                Rate applies on selected locations
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <Text variant="headingSm" as="h6">
                                Ship From Locations
                            </Text>
                            <div style={{ alignItems: 'center', paddingTop: '2%' }}>
                                <Checkbox
                                    label="Select All Location"
                                    checked={checkedState.checked2}
                                    onChange={() => handleCheckChange('checked2')}
                                />
                                {!checkedState.checked2 && (
                                    <div style={{ marginTop: "1%" }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                            {locations.map(location => (
                                                <div key={location.id} style={{ width: '50%', height: "5%", padding: '5px' }}>
                                                    <LegacyCard>
                                                        <div style={{ display: 'flex', alignItems: 'center', padding: "10px", }}>
                                                            <Checkbox
                                                            // checked={checked}
                                                            // onChange={onChange}
                                                            />
                                                            <div style={{ marginLeft: "5%" }}>
                                                                <h2>{location.name}</h2>
                                                                <p>{location.address1 || '-'}</p>

                                                            </div>
                                                        </div>
                                                    </ LegacyCard>
                                                </div>
                                            ))}
                                            {locations.length === 0 && (
                                                <Card>
                                                    <p>No locations found</p>
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </LegacyCard>
                    </Grid.Cell>
                </Grid>

            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '5%' }}>
                            <Text variant="headingLg" as="h5">
                                Schedule Rate
                            </Text>
                            <p style={{ paddingTop: '5%', fontSize: '14px' }}>
                                Rate applies on selected locations
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <Text variant="headingSm" as="h6">
                                Do you want to apply schedule rate?
                            </Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15%', paddingTop: '2%' }}>
                                <RadioButton
                                    label="Yes"
                                    checked={checkstate.selectedByschedule === 'Yes'}
                                    id="Yes"
                                    name="Yes"
                                    onChange={() => handlecheckedChange('selectedByschedule', 'Yes')}
                                />
                                <RadioButton
                                    label="No"
                                    checked={checkstate.selectedByschedule === 'No'}
                                    id="No"
                                    name="No"
                                    onChange={() => handlecheckedChange('selectedByschedule', 'No')}
                                />
                            </div>
                            {checkstate.selectedByschedule === 'Yes' && (

                                <div style={{ display: 'flex', gap: '10px', marginTop: "2%" }}>
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="Start Date"
                                            value={startDate.toLocaleDateString()}
                                            onFocus={() => setIsStartDatePickerVisible(true)}
                                            readOnly
                                        />
                                        {isStartDatePickerVisible && (
                                            <DatePicker
                                                month={month}
                                                year={year}
                                                onChange={handleStartDateChange}
                                                onMonthChange={handleMonthChange}
                                                selected={{ start: startDate, end: startDate }}
                                            />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="End Date"
                                            value={endDate.toLocaleDateString()}
                                            onFocus={() => setIsEndDatePickerVisible(true)}
                                            readOnly
                                        />
                                        {isEndDatePickerVisible && (
                                            <DatePicker
                                                month={month}
                                                year={year}
                                                onChange={handleEndDateChange}
                                                onMonthChange={handleMonthChange}
                                                selected={{ start: endDate, end: endDate }}
                                            />
                                        )}
                                    </div>
                                </div>

                            )}
                        </LegacyCard>
                    </Grid.Cell>
                </Grid>

            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '5%' }}>
                            <Text variant="headingLg" as="h5">
                                Send another rate
                            </Text>
                            <p style={{ paddingTop: '5%', fontSize: '14px' }}>
                                By selecting the Send Another Rate option it will allow to set another additional rate.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>

                            <div style={{ alignItems: 'center' }}>
                                <Checkbox
                                    label="Send Another Rate"
                                    checked={checkedState.checked3}
                                    onChange={() => handleCheckChange('checked3')}
                                />
                                {checkedState.checked3 && (
                                    <div style={{ marginTop: "3%" }}>
                                        <FormLayout>
                                            <FormLayout.Group>
                                                <TextField
                                                    type="text"
                                                    label="Another Rate Name"
                                                    onChange={() => { }}
                                                    autoComplete="off"
                                                    prefix="Rs."
                                                    placeholder='Enter Rate Name'
                                                />
                                                <TextField
                                                    type="text"
                                                    label="Another Rate Description"
                                                    onChange={() => { }}
                                                    autoComplete="off"
                                                    prefix="kg"
                                                    placeholder='Enter Desription'
                                                />
                                            </FormLayout.Group>
                                        </FormLayout>


                                        <div style={{ marginTop: '3%' }}>
                                            <Divider borderColor="border" />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8%', marginTop: '3%', }}>
                                            <Text variant="headingSm" as="h6">
                                                Update Price Type :
                                            </Text>

                                            <RadioButton
                                                label="Fixed"
                                                checked={checkstate.selectedByUpdatePriceType === 'Fixed'}
                                                id="Fixed"
                                                name="Fixed"
                                                onChange={() => handlecheckedChange('selectedByUpdatePriceType', 'Fixed')}
                                            />
                                            <RadioButton
                                                label="Percentage"
                                                checked={checkstate.selectedByUpdatePriceType === 'Pr'}
                                                id="Pr"
                                                name="Pr"
                                                onChange={() => handlecheckedChange('selectedByUpdatePriceType', 'Pr')}
                                            />
                                            <RadioButton
                                                label="Static"
                                                checked={checkstate.selectedByUpdatePriceType === 'Static'}
                                                id="Static"
                                                name="Static"
                                                onChange={() => handlecheckedChange('selectedByUpdatePriceType', 'Static')}
                                            />
                                        </div>

                                        <div style={{ marginTop: '3%' }}>
                                            <Divider borderColor="border" />
                                        </div>
                                        {checkstate.selectedByUpdatePriceType !== 'Static' && (
                                            <div style={{ marginTop: '3%' }}>
                                                <FormLayout>
                                                    <FormLayout.Group>
                                                        <div>
                                                            <Text variant="headingSm" as="h6">
                                                                Update Price Type :
                                                            </Text>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8%', paddingTop: '2%', marginBottom: "4%" }}>
                                                                <RadioButton
                                                                    label="Increase"
                                                                    checked={checkstate.selectedByUpdatePriceEffect === 'increase'}
                                                                    id="increase"
                                                                    name="increase"
                                                                    onChange={() => handlecheckedChange('selectedByUpdatePriceEffect', 'increase')}
                                                                />
                                                                <RadioButton
                                                                    label="Decrease"
                                                                    checked={checkstate.selectedByUpdatePriceEffect === 'decrease'}
                                                                    id="decrease"
                                                                    name="decrease"
                                                                    onChange={() => handlecheckedChange('selectedByUpdatePriceEffect', 'decrease')}
                                                                />

                                                            </div>
                                                        </div>
                                                        <TextField
                                                            type="text"
                                                            label="Adjustment Price"
                                                            onChange={() => { }}
                                                            autoComplete="off"
                                                            prefix="kg"
                                                            placeholder='00'
                                                        />
                                                    </FormLayout.Group>
                                                </FormLayout>
                                            </div>
                                        )}


                                        {checkstate.selectedByUpdatePriceType === 'Static' && (
                                            <div>
                                                <TextField
                                                    type="text"
                                                    label="Adjustment Price"
                                                    onChange={() => { }}
                                                    autoComplete="off"
                                                    prefix="Rs."
                                                    placeholder='0'
                                                />

                                            </div>
                                        )}
                                        <div style={{ marginTop: '3%' }}>
                                            <Divider borderColor="border" />
                                        </div>

                                        <div style={{ marginTop: '3%' }}>
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Service Code"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='Enter Service Code'
                                                    />
                                                    <TextField
                                                        type="text"
                                                        label="Another merge rate tag"
                                                        onChange={() => { }}
                                                        autoComplete="off"
                                                        prefix="kg"
                                                        placeholder='tag1,tag2,tag3'
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                        </div>



                                    </div>
                                )}
                            </div>

                        </LegacyCard>
                    </Grid.Cell>
                </Grid>

            </div>


            {showToast && (
                <Toast content={toastContent} duration={toastDuration} onDismiss={() => setShowToast(false)} />
            )}
            {toastActive && (
                <Toast content={toastMessage} error onDismiss={toggleToastActive} />
            )}
        </Page>
    );
}
export default Rate;
