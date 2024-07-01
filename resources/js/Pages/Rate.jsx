import React, { useState, useCallback, useEffect } from 'react';
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
    Autocomplete
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
    const [inputValue, setInputValue] = useState('');
    const navigate = useNavigate();
    let app = "";
    const [formData, setFormData] = useState({
        name: '',
        base_price: '',
        service_code: '',
        description: '',
        zone_id: zone_id,
        id: "",
        status: 1,
    });
    const [value, setValue] = useState();
    const handleChange = useCallback(
        (newValue) => setValue(newValue),
        [],
    );


    const getCountry = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.get(`${apiCommonURL}/api/country`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(response.data)
        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }
    const updateText = useCallback(
        (value) => {
            setInputValue(value);

            if (value === '') {
                getCountry();
                return;
            }

            const filterRegex = new RegExp(value, 'i');
            const resultOptions = country.filter((option) =>
                option.label.match(filterRegex),
            );

            setState(resultOptions);
        },
        [state],
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
                    const tagLabel = country.find(opt => opt.value === option)?.label || option;
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



    const [selectedCondition, setSelectedCondition] = useState('condition1');
    const [selectedStateCondition, setSelectedStateCondition] = useState('all');
    const [selectedZipCondition, setSelectedZipCondition] = useState('allZip');
    const [selectedZipCode, setSelectedZipCode] = useState('include');
    const [toastDuration, setToastDuration] = useState(3000);
    const [showToast, setShowToast] = useState(false);
    const [toastContent, setToastContent] = useState("");
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);
    const handleSwitchChange = useCallback(
        (newChecked) => {
            setFormData((prevState) => ({
                ...prevState,
                status: newChecked ? 1 : 0,
            }));
        },
        [],
    );
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
        { selectedOption1: 'quantity', selectedOption2: '', inputValue: '' }
    ]);
    const handleSelectChange = (index, newValue, selectNumber) => {
        const updatedItems = [...items];
        if (selectNumber === 1) {
            updatedItems[index].selectedOption1 = newValue;
        } else if (selectNumber === 2) {
            updatedItems[index].selectedOption2 = newValue;
        }
        setItems(updatedItems);
    };
    const handleAddItem = () => {
        const newItem = { selectedOption1: 'quantity', selectedOption2: '', inputValue: '' };
        setItems([...items, newItem]);
    };
    const handleConditionChange = useCallback(
        (newValue, index) => {
            setItems(prevItems => {
                return prevItems.map((item, idx) => {
                    if (idx === index) {
                        return { ...item, inputValue: newValue };
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
    const options = [
        { label: 'Cart / Order', value: '', disabled: true, className: 'select-header' },
        { label: 'Quantity', value: 'quantity' },
        { label: 'Total', value: 'total' },
        { label: 'Sale Product Total', value: 's&ptotal' },
        { label: 'Non Sale Product Total', value: 'ns&ptotal' },
        { label: 'Weight', value: 'weight' },
        { label: 'Line Item', value: 'lineitem' },
        { label: 'Distance', value: 'distance' },
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

    const editRate = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.get(`${apiCommonURL}/api/rate/${rate_id}/edit`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setFormData({
                name: response.data.rate.name,
                base_price: response.data.rate.base_price,
                service_code: response.data.rate.service_code,
                description: response.data.rate.description,
                id: response.data.rate.id,
                zone_id: response.data.rate.zone_id,
                status: response.data.rate.status,
            });
            // setLoading(false)
        } catch (error) {
            console.error("Error fetching edit data:", error);
        }
    };
    useEffect(() => {
        editRate();
    }, []);

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
            fullWidth
            title={rate_id ? 'Edit Rate' : 'Add Rate'}
            primaryAction={<Button variant="primary" onClick={saveRate}>Save</Button>}
            secondaryActions={<Button onClick={() => BacktoZone(zone_id)}>Back</Button>}
        >
            <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '10%' }}>
                            <Text variant="headingLg" as="h5">
                                Rate details
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Specify which rates should apply in this zone
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <LegacyCard sectioned>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: "2%" }}>
                                <Checkbox
                                    label={formData.status === 1 ? 'Rate is enabled' : 'Rate is disabled'}
                                    checked={formData.status === 1}
                                    onChange={handleSwitchChange}
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
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
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
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <LegacyCard sectioned>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: "2%", }}>
                                <Text variant="headingXs" as="h6">
                                    Condition match
                                </Text>
                                <RadioButton
                                    label="Not Any Condition"
                                    checked={selectedCondition === 'condition1'}
                                    id="condition1"
                                    name="condition"
                                    onChange={() => setSelectedCondition('condition1')}
                                />
                                <RadioButton
                                    label="All"
                                    checked={selectedCondition === 'condition2'}
                                    id="condition2"
                                    name="condition"
                                    onChange={() => setSelectedCondition('condition2')}
                                />
                                <RadioButton
                                    label="Any"
                                    checked={selectedCondition === 'condition3'}
                                    id="condition3"
                                    name="condition"
                                    onChange={() => setSelectedCondition('condition3')}
                                />
                                <RadioButton
                                    label="NOT All"
                                    checked={selectedCondition === 'condition4'}
                                    id="condition4"
                                    name="condition"
                                    onChange={() => setSelectedCondition('condition4')}
                                />

                            </div>
                            {selectedCondition !== 'condition1' && (
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
                                                options={options}
                                                onChange={(newValue) => handleSelectChange(index, newValue, 1)}
                                                value={item.selectedOption1}
                                            />
                                            <Select
                                                options={option}
                                                onChange={(newValue) => handleSelectChange(index, newValue, 2)}
                                                value={item.selectedOption2}
                                            />
                                            <TextField
                                                value={item.inputValue}
                                                onChange={(newValue) => handleConditionChange(newValue, index)}
                                                autoComplete="off"
                                            />
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
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>

            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%", }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '7%' }}>
                            <Text variant="headingLg" as="h5">
                                Set State/ZipCode
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Specify rate calculation based on Order Weight, Order Quantity with surcharge value.
                            </p>
                            <p style={{ paddingTop: '1%', fontSize: '14px' }}>
                                Surcharge calculation will add on Base Price which is available on top of the page.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <LegacyCard sectioned>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: "2%", paddingTop: '3%' }}>
                                <Text variant="headingXs" as="h6">
                                    State Selection
                                </Text>
                                <RadioButton
                                    label="Custom"
                                    checked={selectedStateCondition === 'custome'}
                                    id="custome"
                                    name="custome"
                                    onChange={() => setSelectedStateCondition('custome')}
                                />
                                <RadioButton
                                    label="All"
                                    checked={selectedStateCondition === 'all'}
                                    id="all"
                                    name="all"
                                    onChange={() => setSelectedStateCondition('all')}
                                />
                            </div>

                            {selectedStateCondition !== 'all' && (
                                <div style={{ marginTop: "2%", marginBottom: "2%" }}>


                                    <Autocomplete
                                        allowMultiple
                                        options={state}
                                        selected={selectedOptions}
                                        textField={textField}
                                        onSelect={setSelectedOptions}
                                        listTitle="Suggested Countries"
                                    />
                                </div>
                            )}

                            <Divider borderColor="border" />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: "2%", }}>
                                <Text variant="headingXs" as="h6">
                                    ZipCode
                                </Text>
                                <RadioButton
                                    label="Custom"
                                    checked={selectedZipCondition === 'customeZip'}
                                    id="customeZip"
                                    name="customeZip"
                                    onChange={() => setSelectedZipCondition('customeZip')}
                                />
                                <RadioButton
                                    label="All"
                                    checked={selectedZipCondition === 'allZip'}
                                    id="allZip"
                                    name="allZip"
                                    onChange={() => setSelectedZipCondition('allZip')}
                                />

                            </div>
                            {selectedZipCondition !== 'allZip' && (
                                <div style={{ marginTop: "2%" }}>

                                    <TextField
                                        placeholder='364001,364002,364003'
                                        value={value}
                                        onChange={handleChange}
                                        multiline={4}
                                        autoComplete="off"
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: "2%" }}>
                                        <RadioButton
                                            label="Include ZipCodes"
                                            checked={selectedZipCode === 'include'}
                                            id="include"
                                            name="include"
                                            onChange={() => setSelectedZipCode('include')}
                                        />
                                        <RadioButton
                                            label="Exclude ZipCodes"
                                            checked={selectedZipCode === 'exclude'}
                                            id="exclude"
                                            name="exclude"
                                            onChange={() => setSelectedZipCode('exclude')}
                                        />
                                    </div>
                                </div>
                            )}
                        </LegacyCard>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
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
