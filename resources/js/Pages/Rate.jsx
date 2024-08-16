import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
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
    Layout,
    useIndexResourceState,
    IndexTable,
    Thumbnail,
    Icon,
    Box,
    Collapsible,
    List,
    Modal,
    Spinner

} from '@shopify/polaris';
import { DeleteIcon, PlusIcon, SearchIcon, SelectIcon } from '@shopify/polaris-icons';
import '../../../public/css/style.css';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
import '../../../public/css/style.css';
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function Rate(props) {
    const { id, zone_id } = useParams();
    const [loading, setLoading] = useState(true);
    const [loadingButton, setLoadingButton] = useState(false);
    const [state, setState] = useState([])
    const [originalOptions, setOriginalOptions] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [zipcodeValue, setZipcodeValue] = useState('');
    const navigate = useNavigate();
    const [checkstate, setCheckState] = useState({
        selectedCondition: 0,
        selectedStateCondition: 'All',
        selectedByCart: 'weight',
        selectedByschedule: 0,
        selectedByAmount: 'unit',
        selectedByUpdatePriceType: 0,
        selectedByUpdatePriceEffect: 0,
        selectedZipCondition: 'All',
        selectedZipCode: 'exclude',
        selectedMultiplyLine: 'Yes',
        selectedPriceReplace: 'BasePrice',
        exclude_products_radio: 0, // 0=Remove rate  1=Reduce only product price, weight and quantity
        type: 'None',
        Behaviour: 'Stack'
    });
    const handlecheckedChange = (key, value) => {
        setCheckState(prevState => ({ ...prevState, [key]: value }));
        if (key === 'selectedCondition' && value === 0) {
            setItems([]);
        }
        if (key === 'selectedZipCondition' && value === 'All') {
            setZipcodeValue();
        }
        if (key === 'selectedStateCondition' && value === 'All') {
            setSelectedOptions([]);
        }
        if (key === 'selectedByschedule' && value === 0) {
            setDate([]);
        }
    };
    const [checkedState, setCheckedState] = useState({
        checked1: false,
        checked2: true,
        checked3: false,
        checked4: false,
    });
    const handleCheckChange = (checkbox) => {
        const newCheckedState = {
            ...checkedState,
            [checkbox]: !checkedState[checkbox]
        };
        if (checkbox === 'checked1' && !newCheckedState.checked1) {
            Setrate_based_on_surcharge({});
        }
        if (checkbox === 'checked3' && !newCheckedState.checked3) {
            setsend_another_rate({});
        }
        setCheckedState(newCheckedState);
    }
    const [toastDuration] = useState(3000);
    const [showToast, setShowToast] = useState(false);
    const [errorToast, setErroToast] = useState(false)
    const [toastContent, setToastContent] = useState("");
    const [errors, setErrors] = useState({});
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [locations, setLocations] = useState([]);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [showAllProduct, setShowAllProduct] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false)
    const [value, setValue] = useState('');
    const [shop_weight_unit, setshop_weight_unit] = useState()
    const [shop_currency, setShop_currency] = useState()
    const [pageInfo, setPageInfo] = useState({
        startCursor: null,
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [products, setProducts] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [date, setDate] = useState({ startDate: '', endDate: '' });

    const handleDateChange = (key, value) => {
        setDate(prevDates => {
            const updatedDates = { ...prevDates, [key]: value };
            if (key === 'endDate' && new Date(value) < new Date(updatedDates.startDate)) {
                updatedDates.error = 'End date cannot be before start date.';
            } else if (key === 'startDate' && new Date(updatedDates.endDate) < new Date(value)) {
                updatedDates.error = 'End date cannot be before start date.';
            } else {
                updatedDates.error = '';
            }
            return updatedDates;
        });
    };

    const [selectedTierType, setSelectedTierType] = useState('selected');
    const [tiers, setTiers] = useState([
        { minWeight: '', maxWeight: '', basePrice: '', perItem: '', percentCharge: '', perkg: '' }
    ]);
    const handleInputChange = (index, field, value) => {
        const newTiers = [...tiers];
        newTiers[index][field] = value;
        setTiers(newTiers);
    };
    const addTier = () => {
        setTiers([...tiers, { minWeight: '', maxWeight: '', basePrice: '' }]);
    };
    const removeTier = (index) => {
        const newTiers = tiers.filter((_, i) => i !== index);
        setTiers(newTiers);
    };
    const handleTierSelectChange = (value) => {
        setSelectedTierType(value);
        if (value === 'selected') {
            setRateModifiers([]);
        }
    };

    const tierOptions = [
        { label: 'Select Tier Type', value: "selected" },
        { label: 'Order Price', value: 'order_price' },
        { label: 'Order Weight', value: 'order_weight' },
        { label: 'Order Quantity', value: 'order_quantity' },
        { label: 'Order Distance', value: 'order_distance' }
    ];
    const [selectedRate, setSelectedRate] = useState('selected');
    const handleRateSelectChange = (value) => {
        setSelectedRate(value);
        if (value === 'selected') {
            SetExclude_Rate([]);
        }
    };
    const rateOptions = [
        { label: 'Set Exclude Products Option', value: 'selected' },
        { label: 'Custome Selection', value: 'custome_selection' },
        { label: 'Product Vendor', value: 'product_vendor' },
        { label: 'Product Tag', value: 'product_tag' },
        { label: 'Product SKU', value: 'product_sku' },
        { label: 'Product Type', value: 'product_type' },
        // { label: 'Product Properties', value: 'product_properties' }
    ];
    const [rateModifiers, setRateModifiers] = useState([]);
    const rateModifiersOptions = [
        { label: ' Order', value: '', disabled: true, className: 'select-header' },
        { label: 'Day of Order is', value: 'dayOfOrder', mainlabel: "Order" },
        { label: 'Time', value: 'time', mainlabel: "Order" },
        { label: 'Price', value: 'price', mainlabel: "Order" },
        { label: 'Weight', value: 'weight', mainlabel: "Order" },
        { label: 'Quantity', value: 'quantity', mainlabel: "Order" },
        { label: 'Distance', value: 'distance', mainlabel: "Order" },
        { label: 'Local Code', value: 'localCode', mainlabel: "Order" },

        { label: 'Delivery', value: '', disabled: true, className: 'select-header' },
        { label: 'Day ', value: 'day', mainlabel: "Delivery" },
        { label: 'Date', value: 'date', mainlabel: "Delivery" },
        { label: 'X Day from today', value: 'dayFromToday', mainlabel: "Delivery" },
        { label: 'Type', value: 'type', mainlabel: "Delivery" },
        { label: 'X Estimated Delivery Day ', value: 'estimatedDay', mainlabel: "Delivery" },
        { label: 'X Time From Current Time', value: 'timefromCurrent', mainlabel: "Delivery" },
        { label: 'First Available Day', value: 'available', mainlabel: "Delivery" },

        { label: 'Any Product', value: '', disabled: true, className: 'select-header' },
        { label: 'Available Quantity ', value: 'availableQuan', mainlabel: "any_Product" },
        { label: 'IDs', value: 'ids', mainlabel: "any_Product" },
        { label: 'Title', value: 'title', mainlabel: "any_Product" },
        { label: 'Tag', value: 'tag', mainlabel: "any_Product" },
        { label: 'Type', value: 'type2', mainlabel: "any_Product" },
        { label: 'SKU', value: 'sku', mainlabel: "any_Product" },
        // { label: 'Properties', value: 'properties', mainlabel: "any_Product" },
        { label: 'Vendor', value: 'vendor', mainlabel: "any_Product" },
        { label: 'Collection IDs', value: 'collectionsIds', mainlabel: "any_Product" },

        { label: 'Customer', value: '', disabled: true, className: 'select-header' },
        { label: 'Zip Code', value: 'zipcode', mainlabel: "Customer" },
        { label: 'Name', value: 'name', mainlabel: "Customer" },
        { label: 'City', value: 'city', mainlabel: "Customer" },
        { label: 'Province Code', value: 'provinceCode', mainlabel: "Customer" },
        { label: 'Address', value: 'address', mainlabel: "Customer" },
        { label: 'Tag', value: 'tag2', mainlabel: "Customer" },

        // { label: 'Rate', value: '', disabled: true, className: 'select-header' },
        // { label: 'Calculate Rate Price', value: 'calculateRate', mainlabel: "Rate" },
        // { label: 'Third Party Service', value: 'thirdParty', mainlabel: "Rate" },
    ];
    const [open, setOpen] = useState({});
    const handleToggle = (id) => () => {
        setOpen((prevState) => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleFocus = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const handleAddRateModifier = () => {
        const newId = rateModifiers.length ? rateModifiers[rateModifiers.length - 1].id + 1 : 1;
        const defaultRateModifier = 'dayOfOrder';
        const defaultOption = rateModifiersOptions.find(option => option.value === defaultRateModifier);

        setRateModifiers((prevModifiers) => [
            ...prevModifiers,
            {
                id: newId,
                name: '',
                title: '',
                rateModifier: defaultRateModifier,
                rateModifier2: defaultRateModifier,
                label1: defaultOption?.mainlabel || '',
                label2: defaultOption?.mainlabel || '',
                rateOperator: 'equal',
                rateOperator2: 'equal',
                rateDay: '',
                rateDay2: '',
                type: 'None',
                behaviour: 'Stack',
                modifierType: 'Fixed',
                adjustment: '',
                effect: 'Decrease',
                productData: []
            },
        ]);

        setOpen((prevState) => ({
            ...prevState,
            [newId]: true,
        }));
    };
    useEffect(() => {
        if (rateModifiers.length === 0) return;

        const selectedProducts = products.filter(product => selectedProductIds.includes(product.id));

        setRateModifiers((prevModifiers) => {
            // Find the latest modifier to update
            const lastModifierIndex = prevModifiers.length - 1;
            if (lastModifierIndex < 0) return prevModifiers;

            const updatedModifiers = [...prevModifiers];
            updatedModifiers[lastModifierIndex] = {
                ...updatedModifiers[lastModifierIndex],
                productData: selectedProducts.map(({ id, title, price }) => ({
                    id,
                    title,
                    price,
                })),
            };

            return updatedModifiers;
        });
    }, [selectedProductIds, products]);

    const handleRemoveRateModifier = (id) => {
        setRateModifiers((prevModifiers) =>
            prevModifiers.filter((modifier) => modifier.id !== id)
        );
        setOpen((prevState) => {
            const newState = { ...prevState };
            delete newState[id];
            return newState;
        });
    };
    const handleRateModifierChange = (id, field) => (value) => {
        const option = rateModifiersOptions.find(opt => opt.value === value);
        setRateModifiers((prevModifiers) =>
            prevModifiers.map((modifier) =>
                modifier.id === id ? {
                    ...modifier,
                    [field]: value,
                    ...(field === 'rateModifier' && { label1: option?.mainlabel || '', rateDay: null }),
                    ...(field === 'rateModifier2' && { label2: option?.mainlabel || '', rateDay2: null }),
                } : modifier
            )
        );
    };

    const rateTag = [
        { label: 'Equals', value: 'equal' },
        { label: 'Does Not Equal', value: 'notequal' },
        { label: 'Contains', value: 'contains' },
        { label: 'Does not contains', value: 'notcontains' },
    ];
    const type = [
        { label: 'Selected Order Shipping Method' },
        { label: 'Shipping', value: 'shipping' },
        { label: 'Local Delivery', value: 'localDelivery' },
        { label: 'Store Pickup', value: 'storePickup' },
    ];
    const firstAvailableDay = [
        { label: 'Select First Available Day', value: 'firstDay' },
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
    ];
    const ratesku = [
        { label: 'Equal', value: 'equal' },
        { label: 'Does Not Equal', value: 'notequal' },
        { label: 'Contains', value: 'contains' },
        { label: 'Does not contains', value: 'notcontains' },
        { label: 'Start with', value: 'startwith' },
    ];
    const rateTimeOptions = [
        { label: 'Equal', value: 'equal' },
        { label: 'Does Not Equal', value: 'notequal' },
        { label: 'Less then or Equal', value: 'lthenoequal' },
        { label: 'Greater then or Equal', value: 'gthenoequal' },
    ];
    const rateAvailableQuantity = [
        { label: 'Less then or Equal', value: 'lthenoequal' },
        { label: 'Greater then or Equal', value: 'gthenoequal' },
    ];
    const rateAvailableOptions = [
        { label: 'Equal', value: 'equal' },
    ];
    const rateQuantityOptions = [
        { label: 'Equal', value: 'equal' },
        { label: 'Does Not Equal', value: 'notequal' },
        { label: 'Less then or Equal', value: 'lthenoequal' },
        { label: 'Greater then or Equal', value: 'gthenoequal' },
        { label: 'Is modular 0', value: 'modular0' },
        { label: 'Is not modular 0', value: 'modularnot0' },
    ];
    const rateDayOptions = [
        { label: 'Select Day Of Order', value: 'selected' },
        { label: 'Sunday', value: 'Sunday' },
        { label: 'Monday', value: 'Monday' },
        { label: 'Tuesday', value: 'Tuesday' },
        { label: 'Wednesday', value: 'Wednesday' },
        { label: 'Thursday', value: 'Thursday' },
        { label: 'Friday', value: 'Friday' },
        { label: 'Saturday', value: 'Saturday' },
    ];
    let app = "";

    const handleChange = useCallback((value) => {
        setZipcodeValue(value);
    }, []);

    const editRate = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.get(`${apiCommonURL}/api/rate/${id}/edit`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(response.data)
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
            if (response.data.rate.exclude_rate_for_products) {
                setSelectedRate(response.data.rate.exclude_rate_for_products.set_exclude_products);
                SetExclude_Rate(response.data.rate.exclude_rate_for_products);
            }
            if (response.data.rate.rate_modifiers) {
                setRateModifiers(response.data.rate.rate_modifiers);

                const selectedIds = response.data.rate.rate_modifiers.flatMap(modifier =>
                    modifier.productData ? modifier.productData.map(product => product.id) : []
                );
                setSelectedProductIds(selectedIds);
            }

            if (response.data.rate.cart_condition) {
                setCheckState(prevState => ({
                    ...prevState,
                    selectedCondition: response.data.rate.cart_condition.conditionMatch,
                }));
                setItems(response.data.rate.cart_condition.cartCondition);
                const cartCondition = response.data.rate.cart_condition.cartCondition;
                const initialDeliveryType = cartCondition.map(condition => ({
                    id: condition.id,
                    local: condition.name === 'type2' && condition.value.includes('local'),
                    Store: condition.name === 'type2' && condition.value.includes('Store'),
                    Shipping: condition.name === 'type2' && condition.value.includes('Shipping'),
                }));
                setDeliveryType(initialDeliveryType);
                const initialDeliveryday = cartCondition.map(condition => ({
                    id: condition.id,
                    Sunday: (condition.name === 'dayOfWeek' || condition.name === 'day') && condition.value.includes('Sunday'),
                    Monday: (condition.name === 'dayOfWeek' || condition.name === 'day') && condition.value.includes('Monday'),
                    Tuesday: (condition.name === 'dayOfWeek' || condition.name === 'day') && condition.value.includes('Tuesday'),
                    Wednesday: (condition.name === 'dayOfWeek' || condition.name === 'day') && condition.value.includes('Wednesday'),
                    Thursday: (condition.name === 'dayOfWeek' || condition.name === 'day') && condition.value.includes('Thursday'),
                    Friday: (condition.name === 'dayOfWeek' || condition.name === 'day') && condition.value.includes('Friday'),
                    Saturday: (condition.name === 'dayOfWeek' || condition.name === 'day') && condition.value.includes('Saturday'),
                }));
                setDayOfWeekSelection(initialDeliveryday);
            }
            if (response.data.rate.send_another_rate) {
                setCheckState(prevState => ({
                    ...prevState,
                    selectedByUpdatePriceType: response.data.rate.send_another_rate.update_price_type,
                    selectedByUpdatePriceEffect: response.data.rate.send_another_rate.update_price_effect,
                }));
                setCheckedState(prevState => ({
                    ...prevState,
                    checked3: response.data.rate.send_another_rate.send_another_rate,
                }));
                setsend_another_rate(response.data.rate.send_another_rate);
            }
            if (response.data.rate.rate_based_on_surcharge) {
                setCheckState(prevState => ({
                    ...prevState,
                    selectedByCart: response.data.rate.rate_based_on_surcharge.cart_and_product_surcharge,
                    selectedByAmount: response.data.rate.rate_based_on_surcharge.selectedByAmount,
                    selectedMultiplyLine: response.data.rate.rate_based_on_surcharge.selectedMultiplyLine
                }));
                setCheckedState(prevState => ({
                    ...prevState,
                    checked1: response.data.rate.rate_based_on_surcharge.based_on_cart,
                }));
                const surchargeData = response.data.rate.rate_based_on_surcharge || {};
                Setrate_based_on_surcharge({
                    ...surchargeData,
                    charge_per_wight: surchargeData.charge_per_wight || '',
                    unit_for: surchargeData.unit_for || '',
                    min_charge_price: surchargeData.min_charge_price || '',
                    max_charge_price: surchargeData.max_charge_price || '',
                    rate_price: surchargeData.rate_price || '',
                    cart_total_percentage: surchargeData.cart_total_percentage || '',
                    // productData: surchargeData.productData || '',
                });

            }

            if (response.data.rate.rate_tier) {
                setSelectedTierType(response.data.rate.rate_tier.tier_type);
                setTiers(response.data.rate.rate_tier.rateTier);
            }
            const rate = response.data.rate;
            setFormData(prevState => {
                const updatedProductData = (prevState.productdata || []).map(item => {
                    return {
                        ...item,
                        value: item.id === rate.id ? rate.value : item.value
                    };
                });
                return {
                    ...prevState,
                    name: rate.name,
                    base_price: rate.base_price,
                    service_code: rate.service_code,
                    description: rate.description,
                    id: rate.id,
                    zone_id: rate.zone_id,
                    status: rate.status,
                    merge_rate_tag: rate.merge_rate_tag,
                    productdata: updatedProductData
                };
            });
            if (response.data.rate.scheduleRate) {
                setDate(prevState => ({
                    ...prevState,
                    startDate: moment(response.data.rate.scheduleRate.schedule_start_date_time, "DD-MM-YYYY hh:mm A").format("YYYY-MM-DDTHH:mm"),
                    endDate: moment(response.data.rate.scheduleRate.schedule_end_date_time, "DD-MM-YYYY hh:mm A").format("YYYY-MM-DDTHH:mm"),
                }));
                setCheckState(prevState => ({
                    ...prevState,
                    selectedByschedule: response.data.rate.scheduleRate.schedule_rate,
                }));
            }
            if (response.data.rate.origin_locations) {
                setCheckedState(prevState => ({
                    ...prevState,
                    checked2: response.data.rate.origin_locations.ship_from_locations,
                }));
                const initialCheckedState = response.data.rate.origin_locations.updated_location.reduce((acc, location) => {
                    acc[location.name] = {
                        checked: true,
                        address: location.address || '-'
                    };
                    return acc;
                }, {});
                setCheckedlocation(initialCheckedState);
            }
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
            const initialCheckedState = response.data.locations.reduce((acc, location) => {
                acc[location.id] = false;
                return acc;
            }, {});
            setCheckedlocation(initialCheckedState);
        } catch (error) {
            console.error("Error fetching shop location:", error);
        }
    };
    const [checkedlocation, setCheckedlocation] = useState({});
    const handleLocationChange = (location) => {
        setCheckedlocation(prevState => {
            const isChecked = prevState[location.name]?.checked;
            return {
                ...prevState,
                [location.name]: {
                    checked: !isChecked,
                    address: location.address1 || '-'
                }
            };
        });
    };

    const handlesearchChange = useCallback(
        (newValue) => {
            setValue(newValue);
            if (newValue === '') {
                setFilteredProducts(products);
            } else {
                const lowerCaseValue = newValue.toLowerCase();
                setFilteredProducts(products.filter(product =>
                    product.title.toLowerCase().includes(lowerCaseValue)
                ));
            }
        },
        [products]
    );
    const handleClearButtonClick = useCallback(() => {
        setValue('');
    }, [products]);

    const getstate = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.get(`${apiCommonURL}/api/rate/${zone_id}/create`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const allStates = response.data.states;
            setshop_weight_unit(response.data.rate.shop_weight_unit);
            setShop_currency(response.data.rate.shop_currency);
            const formattedOptions = [];
            for (const country in allStates) {
                if (allStates.hasOwnProperty(country)) {
                    const countryData = allStates[country];
                    const stateOptions = countryData.map(state => ({
                        value: state.code,
                        label: state.nameCode
                    }));
                    formattedOptions.push({
                        title: country,
                        options: stateOptions
                    });
                }
            }
            setOptions(formattedOptions);
            setOriginalOptions(formattedOptions);
            setState(formattedOptions.map(section => section.options).flat());
        } catch (error) {
            console.error("Error fetching shop location:", error);
        }
    };

    const updateText = useCallback(
        (value) => {
            setInputValue(value);
            if (value === '') {
                setOptions(originalOptions);
                return;
            }
            const filterRegex = new RegExp(value, 'i');
            const resultOptions = [];
            originalOptions.forEach((opt) => {
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
        [originalOptions],
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
            error={errors.selectedOptions}
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
    const option = [
        { label: 'Equal', value: 'equal', },
        { label: 'Does Not Eqaul', value: 'notequal' },
        { label: 'Greatre then or Eqaul', value: 'gthenoequal' },
        { label: 'Less then or Eqaul', value: 'lthenoequal' },
        { label: 'Between', value: 'between' },
    ];
    const time = [
        { label: '00:00', value: '00:00' },
        { label: '01:00', value: '01:00' },
        { label: '02:00', value: '02:00' },
        { label: '03:00', value: '03:00' },
        { label: '04:00', value: '04:00' },
        { label: '05:00', value: '05:00' },
        { label: '06:00', value: '06:00' },
        { label: '07:00', value: '07:00' },
        { label: '08:00', value: '08:00' },
        { label: '09:00', value: '09:00' },
        { label: '10:00', value: '10:00' },
        { label: '11:00', value: '11:00' },
        { label: '12:00', value: '12:00' },
        { label: '13:00', value: '13:00' },
        { label: '14:00', value: '14:00' },
        { label: '15:00', value: '15:00' },
        { label: '16:00', value: '16:00' },
        { label: '17:00', value: '17:00' },
        { label: '18:00', value: '18:00' },
        { label: '19:00', value: '19:00' },
        { label: '20:00', value: '20:00' },
        { label: '21:00', value: '21:00' },
        { label: '22:00', value: '22:00' },
        { label: '23:00', value: '23:00' },
        { label: '24:00', value: '24:00' }
    ];
    const lineItem = [
        { label: 'ANY product must satisfy this conditin ', value: 'any' },
        { label: 'ANY SPECIFIC product with TAg', value: 'anyTag' },
    ]
    const timeIs = [
        { label: 'Between', value: 'between' },
    ]
    const day = [
        { label: 'Equal', value: 'equal' },
        { label: 'Does not equal', value: 'notequal' },
    ]
    const address = [
        { label: 'Contains', value: 'contains' },
        { label: 'Does not contains', value: 'notcontains' },
    ]
    const name = [
        { label: 'Equal', value: 'equal' },
        { label: 'Does not equal', value: 'notequal' },
        { label: 'Contains', value: 'contains' },
        { label: 'Does not contains', value: 'notcontains' },
        { label: 'Start with', value: 'startwith' },
        { label: 'Does not start with ', value: 'notstartwith' },
    ]
    const per_product = [
        { label: 'ANY product must satisfy this conditin ', value: 'any' },
        { label: 'ALL product must satisfy this conditin ', value: 'all' },
        { label: 'NONE of product must satisfy this conditin ', value: 'none' },
        { label: 'ANY SPECIFIC product with TAg', value: 'anyTag' },
        { label: 'ALL SPECIFIC product with TAg', value: 'allTag' },
    ]
    const per_product2 = [
        { label: 'ANY product must satisfy this conditin ', value: 'any' },
        { label: 'ALL product must satisfy this conditin ', value: 'all' },
        { label: 'NONE of product must satisfy this conditin ', value: 'none' },
    ]
    const [deliveryType, setDeliveryType] = useState([{
        id: 0,
        local: false,
        Store: false,
        Shipping: false,
    }]);
    const [dayOfWeekSelection, setDayOfWeekSelection] = useState([{
        id: 0,
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false,
    }]);

    const [items, setItems] = useState([]);
    const handleItemDateChange = (index, key, value) => {
        setItems(prevItems => {
            const updatedItems = [...prevItems];
            updatedItems[index] = {
                ...updatedItems[index],
                [key]: value
            };
            return updatedItems;
        });
    };

    const handleCheckboxChange = useCallback((type, index) => {
        setDeliveryType((prevState) => {
            const updatedItems = [...prevState];
            updatedItems[index] = {
                ...updatedItems[index],
                [type]: !updatedItems[index][type],
            };
            const selectedTypes = Object.keys(updatedItems[index]).filter(key => updatedItems[index][key]);
            const selectedTypesString = selectedTypes.join(', ');
            setItems((prevItems) => {
                const updatedItemsList = [...prevItems];
                updatedItemsList[index] = {
                    ...updatedItemsList[index],
                    value: selectedTypesString,
                };
                return updatedItemsList;
            });
            return updatedItems;
        });
    }, [items]);

    const handleDayCheckboxChange = useCallback((type, index) => {
        setDayOfWeekSelection((prevState) => {
            const updatedItems = [...prevState];
            updatedItems[index] = {
                ...updatedItems[index],
                [type]: !updatedItems[index][type],
            };
            const selectedTypes = Object.keys(updatedItems[index]).filter(key => updatedItems[index][key]);
            const selectedTypesString = selectedTypes.join(', ');
            setItems((prevItems) => {
                const updatedItemsList = [...prevItems];
                updatedItemsList[index] = {
                    ...updatedItemsList[index],
                    value: selectedTypesString,
                };
                return updatedItemsList;
            });
            return updatedItems;
        });
    }, [items]);

    const getCategory = (itemName) => {
        let categoryLabel = '';
        const item = validations.find(option => option.value === itemName);
        if (item) {
            const index = validations.indexOf(item);
            for (let i = index; i >= 0; i--) {
                if (validations[i].className === 'select-header' && validations[i].disabled) {
                    categoryLabel = validations[i].label;
                    break;
                }
            }
        }
        return categoryLabel;
    };

    const validations = [
        { label: 'Cart / Order', value: '', disabled: true, className: 'select-header' },
        { label: 'Quantity', value: 'quantity', unit: 'items', mainlabel: "Cart_Order" },
        { label: 'Total', value: 'total', unit: shop_currency, mainlabel: "Cart_Order" },
        // { label: 'Sale Product Total', value: 's&ptotal', unit: shop_currency, mainlabel: "Cart_Order" },
        // { label: 'Non Sale Product Total', value: 'ns&ptotal', unit: shop_currency, mainlabel: "Cart_Order" },
        { label: 'Weight', value: 'weight', unit: shop_weight_unit, mainlabel: "Cart_Order" },
        { label: 'Line Item', value: 'lineitem', mainlabel: "Cart_Order" },
        { label: 'Distance', value: 'distance', unit: 'km', mainlabel: "Cart_Order" },
        { label: 'Day', value: 'day', mainlabel: "Cart_Order" },
        { label: 'Time', value: 'time', mainlabel: "Cart_Order" },
        { label: 'Local Code', value: 'localcode', mainlabel: "Cart_Order" },

        { label: 'Per Product', value: '', disabled: true, className: 'select-header' },
        { label: 'Quantity', value: 'quantity2', unit: 'items', mainlabel: 'Per_Product' },
        { label: 'Price', value: 'price', unit: shop_currency, mainlabel: 'Per_Product' },
        { label: 'Total', value: 'total2', unit: shop_currency, mainlabel: 'Per_Product' },
        { label: 'Weight', value: 'weight2', unit: shop_weight_unit, mainlabel: 'Per_Product' },
        { label: 'Name', value: 'name', mainlabel: 'Per_Product' },
        { label: 'Tag', value: 'tag', mainlabel: 'Per_Product' },
        { label: 'SKU', value: 'sku', mainlabel: 'Per_Product' },
        { label: 'Type', value: 'type', mainlabel: 'Per_Product' },
        { label: 'Vendor', value: 'vendor', mainlabel: 'Per_Product' },
        // { label: 'Properties', value: 'properties', mainlabel: 'Per_Product' },

        { label: 'Customer', value: '', disabled: true, className: 'select-header' },
        { label: 'Name', value: 'name2', mainlabel: 'Customer' },
        { label: 'Email', value: 'email', mainlabel: 'Customer' },
        { label: 'Phone', value: 'phone', mainlabel: 'Customer' },
        { label: 'Compnay', value: 'company', mainlabel: 'Customer' },
        { label: 'Address', value: 'address', mainlabel: 'Customer' },
        { label: 'Address1', value: 'addrss1', mainlabel: 'Customer' },
        { label: 'Address2', value: 'address2', mainlabel: 'Customer' },
        { label: 'City', value: 'city', mainlabel: 'Customer' },
        { label: 'Province COde', value: 'provinceCode', mainlabel: 'Customer' },
        { label: 'Tag', value: 'tag2', mainlabel: 'Customer' },
        { label: 'Previous Orders Count', value: 'previousCount', mainlabel: 'Customer' },
        { label: 'Previous Orders Spent ', value: 'previousSpent', mainlabel: 'Customer' },

        { label: 'Delivery', value: '', disabled: true, className: 'select-header' },
        { label: 'Day Of Week', value: 'dayOfWeek', mainlabel: "Delivery" },
        { label: 'Day Is', value: 'dayIs', mainlabel: "Delivery" },
        { label: 'Date', value: 'date', mainlabel: "Delivery" },
        { label: 'Time In', value: 'timeIn', mainlabel: "Delivery" },
        { label: 'Type', value: 'type2', mainlabel: "Delivery" }
    ];

    const handleAddItem = () => {
        setItems(prevItems => {
            const newId = prevItems.length ? prevItems[prevItems.length - 1].id + 1 : 1;
            const newItem = {
                id: newId,
                name: 'quantity',
                condition: 'equal',
                value: '',
                value2: '',
                unit: 'items',
                label: 'cart_order',
                lineItem: 'any',
                tag: '',
                per_product: 'any',
            };
            const updatedItems = [...prevItems, newItem];
            return updatedItems;
        });
    };

    const handleConditionsChange = useCallback((index, field) => (value) => {
        setItems((prevState) => {
            const updatedItems = [...prevState];
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: value,
            };
            return updatedItems;
        });
    }, []);

    const handleSelectChange = (index, newValue, isSecondSelect) => {
        const selectedOption = validations.find(option => option.value === newValue) || {};
        if (newValue === 'type2') {
            setDeliveryType(prevState => {
                const updatedItems = [...prevState];
                updatedItems[index] = {
                    id: index,
                    local: false,
                    Store: false,
                    Shipping: false,
                };
                return updatedItems;
            });
        }
        else if (newValue === 'dayOfWeek' || newValue === 'day') {
            setDayOfWeekSelection(prevState => {
                const updatedItems = [...prevState];
                updatedItems[index] = {
                    id: index,
                    Monday: false,
                    Tuesday: false,
                    Wednesday: false,
                    Thursday: false,
                    Friday: false,
                    Saturday: false,
                    Sunday: false,
                };
                return updatedItems;
            });
        }
        const updatedItem = {
            ...items[index],
            condition: isSecondSelect ? newValue : items[index].condition,
            name: isSecondSelect ? items[index].name : newValue,
            unit: isSecondSelect ? items[index].unit : selectedOption.unit || '',
            label: selectedOption.mainlabel || '',
            value: isSecondSelect ? items[index].value : '',
            value2: isSecondSelect ? items[index].value : '',
        };
        const updatedItems = [...items];
        updatedItems[index] = updatedItem;
        setItems(updatedItems);
    };

    const handleConditionChange = useCallback(
        (newValue, index, key) => {
            setItems(prevItems => {
                return prevItems.map((item, idx) => {
                    if (idx === index) {
                        return { ...item, [key]: newValue };
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
        if (id) {
            editRate();
        }
        getLocation();
        getstate();
        fetchProducts()
    }, []);

    const [rate_based_on_surcharge, Setrate_based_on_surcharge] = useState({
        charge_per_wight: '',
        unit_for: '',
        min_charge_price: '',
        max_charge_price: '',
        cart_total_percentage: '',
        descriptions: '',
        rate_price: '',
        productData: []
    })

    const [send_another_rate, setsend_another_rate] = useState({
        send_another_rate: checkedState.checked3,
        another_rate_name: '',
        another_rate_description: '',
        update_price_type: checkstate.selectedByUpdatePriceType,
        update_price_effect: checkstate.selectedByUpdatePriceEffect,
        adjustment_price: '',
        another_service_code: "",
        another_merge_rate_tag: ''
    })

    const [exclude_Rate, SetExclude_Rate] = useState({
        set_exclude_products: selectedRate,
        exclude_products_radio: checkstate.exclude_products_radio,
        product_title: '',
        collection_id: '',
        product_type: '',
        product_vendor: '',
        exclude_products_textbox: '',
        productsData: []
    })

    useEffect(() => {
        setsend_another_rate(prevState => ({
            ...prevState,
            send_another_rate: checkedState.checked3,
            update_price_type: checkstate.selectedByUpdatePriceType,
            update_price_effect: checkstate.selectedByUpdatePriceEffect
        }));
        SetExclude_Rate(prevState => ({
            ...prevState,
            set_exclude_products: selectedRate,
        }));
        const updated_location = locations
            .filter(location => checkedlocation[location.name]?.checked)
            .map(location => ({
                name: location.name,
                address: location.address1 || '-'
            }));
        setFormData(prevState => ({
            ...prevState,
            origin_locations: {
                updated_location,
                ship_from_locations: checkedState.checked2
            }
        }));

    }, [checkedState.checked3, checkstate.selectedByUpdatePriceType, checkstate.selectedByUpdatePriceEffect, selectedRate, locations, checkedlocation]);

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
        rate_tier: {
            tier_type: selectedTierType,
            rateTier: selectedTierType === 'selected' ? [] : tiers,
        },
        scheduleRate: {
            schedule_rate: checkstate.selectedByschedule,
            schedule_start_date_time: date.startDate,
            schedule_end_date_time: date.endDate

        },
        rate_based_on_surcharge: {
            cart_and_product_surcharge: checkstate.selectedByCart,
            based_on_cart: checkedState.checked1,
            selectedByAmount: checkstate.selectedByAmount,
            selectedMultiplyLine: checkstate.selectedMultiplyLine,
            rate_based_on_surcharge,
        },
        rate_modifiers: rateModifiers,
        exclude_rate_for_products: exclude_Rate,
        status: 1,
        merge_rate_tag: '',
        origin_locations: [],
        productdata: [],
    });

    const handleRateFormChange = (field) => (value) => {
        setFormData((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        setsend_another_rate((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        SetExclude_Rate((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        Setrate_based_on_surcharge((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };

    useEffect(() => {
        const selectedStates = selectedOptions.map(option => ({
            name: state.find(state => state.value === option)?.label || '',
            code: option
        }));
        setFormData(prevFormData => ({
            ...prevFormData,
            id: id,
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
                zipcode: zipcodeValue?.split(',').map(zip => zip.trim())
            },
            scheduleRate: {
                ...prevFormData.scheduleRate,
                schedule_rate: checkstate.selectedByschedule,
                schedule_start_date_time: date.startDate,
                schedule_end_date_time: date.endDate
            },
            rate_based_on_surcharge: {
                ...prevFormData.rate_based_on_surcharge,
                cart_and_product_surcharge: checkstate.selectedByCart,
                based_on_cart: checkedState.checked1,
                selectedByAmount: checkstate.selectedByAmount,
                selectedMultiplyLine: checkstate.selectedMultiplyLine,
                charge_per_wight: rate_based_on_surcharge?.charge_per_wight || '',
                unit_for: rate_based_on_surcharge?.unit_for || '',
                min_charge_price: rate_based_on_surcharge?.min_charge_price || '',
                max_charge_price: rate_based_on_surcharge?.max_charge_price || '',
                productData: rate_based_on_surcharge?.productData || '',
                descriptions: rate_based_on_surcharge?.descriptions || '',
                cart_total_percentage: rate_based_on_surcharge?.cart_total_percentage || '',
                product_title: rate_based_on_surcharge?.product_title || '',
                collecion_id: rate_based_on_surcharge?.collecion_id || '',
                product_type: rate_based_on_surcharge?.product_type || '',
                product_vendor: rate_based_on_surcharge?.product_vendor || ''
            },
            rate_tier: {
                ...prevFormData.rate_tier,
                tier_type: selectedTierType,
                rateTier: selectedTierType === 'selected' ? [] : tiers,
            },
            send_another_rate,
            exclude_rate_for_products: exclude_Rate,
            rate_modifiers: rateModifiers,
        }));
    }, [
        selectedOptions, items, zipcodeValue, checkstate.selectedCondition,
        checkstate.selectedStateCondition, checkstate.selectedZipCondition,
        checkstate.selectedZipCode, state, checkstate.selectedByschedule,
        checkstate.selectedByCart, date, rate_based_on_surcharge,
        checkedState.checked1, checkstate.selectedByAmount,
        checkstate.selectedMultiplyLine, selectedTierType, tiers,
        exclude_Rate, rateModifiers, send_another_rate,
        checkedState.checked3, checkstate.selectedByUpdatePriceType,
        checkstate.selectedByUpdatePriceEffect
    ]);

    const removeEmptyFields = (obj) => {
        return Object.entries(obj)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            .reduce((acc, [key, value]) => {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    acc[key] = removeEmptyFields(value);
                } else {
                    acc[key] = value;
                }
                return acc;
            }, {});
    };
    const saveRate = async () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Rate name is required';
        if (!formData.base_price) newErrors.base_price = 'Base price is required';
        if (!formData.service_code) newErrors.service_code = 'Service code is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (checkedState.checked3) {
            if (!send_another_rate.another_rate_name) {
                newErrors.another_rate_name = 'Another Rate Name is required';
            }
            if (!send_another_rate.adjustment_price) {
                newErrors.adjustment_price = 'Adjustment Price is required';
            }
        }
        if (checkstate.selectedStateCondition !== 'All' && selectedOptions.length === 0) {
            newErrors.selectedOptions = 'Please select at least one country.';
        }
        if (checkstate.selectedZipCondition !== 'All' && !zipcodeValue) {
            newErrors.zipcodeValue = 'The zipcodes field is required.';
        }
        if (
            (selectedRate === 'product_vendor' ||
                selectedRate === 'product_sku' ||
                selectedRate === 'product_type' ||
                selectedRate === 'product_properties') &&
            !exclude_Rate.exclude_products_textbox
        ) {
            newErrors.exclude_products_textbox = 'Exclude products field is required';
        }
        if (selectedTierType !== 'selected') {
            tiers.forEach((tier, index) => {
                if (!tier.minWeight)
                    newErrors[`minWeight${index}`] = `Minimum weight for Tier ${index + 1} is required`;
                if (!tier.maxWeight)
                    newErrors[`maxWeight${index}`] = `Maximum weight for Tier ${index + 1} is required`;
                if (!tier.basePrice)
                    newErrors[`basePrice${index}`] = `Base price for Tier ${index + 1} is required`;
            });
        }
        if (rateModifiers.length > 0) {
            rateModifiers.forEach((modifier, index) => {
                if (!modifier.name)
                    newErrors[`name${index}`] = `Rate modifier name for Modifier ${index + 1} is required`;
                if (!modifier.adjustment)
                    newErrors[`adjustment${index}`] = `Adjustment for Modifier ${index + 1} is required`;
            });
        }
        if (items.length > 0) {
            items.forEach((item, index) => {
                if (!item.value)
                    newErrors[`value${index}`] = 'Value is required.';
            });
        }
        if (checkedState.checked1) {
            if (checkstate.selectedByCart === 'weight' || checkstate.selectedByCart === 'Qty' || checkstate.selectedByCart === 'Distance') {
                if (!rate_based_on_surcharge.charge_per_wight) {
                    newErrors.charge_per_wight = 'The charge field is required.';
                }
                if (!rate_based_on_surcharge.unit_for) {
                    newErrors.unit_for = 'The unit field is required.';
                }
            }
            if (checkstate.selectedByCart === 'Percentage') {
                if (!rate_based_on_surcharge.cart_total_percentage) {
                    newErrors.cart_total_percentage = 'The cart total percentage field is required.';
                }

            }
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setToastContent('Sorry. Couldn’t be saved. Please try again.');
            setErroToast(true);
            return;
        }
        try {
            setLoadingButton(true);
            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);
            const cleanFormData = removeEmptyFields(formData);
            const response = await axios.post(`${apiCommonURL}/api/rate/save`, cleanFormData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setFormData(prevFormData => ({
                ...prevFormData,
                id: response.data.id,
            }))
            setErrors({});
            setToastContent('Rate saved successfully');
            setShowToast(true);
            editRate();
            setLoadingButton(false);
        } catch (error) {
            console.error('Error occurs', error);
            setToastContent('Error occurred while saving data');
            setShowToast(true);
        }
        finally {
            setLoadingButton(false);
        }
    };
    const [textFields, setTextFields] = useState({
        fullProductTitle: '',
        collectionId: '',
        productType: '',
        productVendor: ''
    });

    const handleTextFieldChange = (field) => (value) => {
        setTextFields((prevFields) => {
            const updatedFields = {
                fullProductTitle: field === 'fullProductTitle' ? value : '',
                collectionId: field === 'collectionId' ? value : '',
                productType: field === 'productType' ? value : '',
                productVendor: field === 'productVendor' ? value : '',
            };
    
            return {
                ...prevFields,
                ...updatedFields,
            };
        });
    };
    
    const fetchProducts = async (cursor, direction) => {
        try {
          setLoadingTable(true)
            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);
    
            const queryArray = Object.values(textFields).filter(value => value.trim() !== '');
            const queryString = queryArray.join(' ');
    
            const payload = {
                ...(direction === 'next' ? { endCursor: cursor } : { startCursor: cursor }),
                query: queryString 
            };
        
            const response = await axios.post(`${apiCommonURL}/api/products`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            const productData = response.data;
            setProducts(productData.products);
            setPageInfo({
                startCursor: productData.startCursor,
                endCursor: productData.endCursor,
                hasNextPage: productData.hasNextPage,
                hasPreviousPage: productData.hasPreviousPage,
            });
            setLoading(false);
            setLoadingTable(false)
        } catch (error) {
            setLoadingTable
            setLoading(false);
            console.error('Error fetching product data:', error);
        }
    };
    
    const handleNextPage = () => {
        if (pageInfo.hasNextPage) {
            fetchProducts(pageInfo.endCursor, 'next');
        }
    };
    const handlePreviousPage = () => {
        if (pageInfo.hasPreviousPage) {
            fetchProducts(pageInfo.startCursor, 'prev');
        }
    };
    const resourceName = {
        singular: 'order',
        plural: 'products',
    };
    // const handleSearchClick = () => {
    //     setShowAllProducts(true);
    // };
    const handleSearchClick = () => {
        fetchProducts();
        setShowAllProducts(true);
    };
    const handleClick = () => {
        fetchProducts();
        setShowAllProduct(!showAllProducts);
    };

    useEffect(() => {
        if (formData.id) {
            navigate(`/Zone/${zone_id}/Rate/Edit/${formData.id}`);
        }
    }, [formData.id, zone_id, navigate]);

    const handleProductChange = (productId, checked, text = '') => {
        Setrate_based_on_surcharge((prevState) => {
            let updatedProductData = Array.isArray(prevState.productData) ? [...prevState.productData] : [];

            if (checked) {
                const product = products.find(product => product.id == productId);
                if (product) {
                    const existingProductIndex = updatedProductData.findIndex(item => item.id == productId);

                    if (existingProductIndex !== -1) {
                        updatedProductData[existingProductIndex] = {
                            ...updatedProductData[existingProductIndex],
                            value: text
                        };
                    } else {
                        updatedProductData = [
                            ...updatedProductData,
                            {
                                id: product.id,
                                title: product.title,
                                price: product.price,
                                value: text
                            }
                        ];
                    }
                }
            } else {
                updatedProductData = updatedProductData.filter(item => item.id !== productId);
            }

            return {
                ...prevState,
                productData: updatedProductData,
            };
        });
    };

    const selectedCount = rate_based_on_surcharge.productData.length
    const filteredProducts = showAllProducts
        ? products.filter(product => product.title.toLowerCase().includes)
        : products.filter(product => rate_based_on_surcharge.productData.some(item => item.id === product.id));

    const rowMarkup = filteredProducts.map(({ id, title, image, price }, index) => {
        const isChecked = Array.isArray(rate_based_on_surcharge.productData) && rate_based_on_surcharge.productData.some(item => item.id === id);
        const productValue = Array.isArray(rate_based_on_surcharge.productData) ? rate_based_on_surcharge.productData.find(item => item.id === id)?.value || '' : '';

        return (
            <IndexTable.Row
                id={id}
                key={id}
                position={index}
            >
                <IndexTable.Cell>
                    <Checkbox
                        checked={isChecked}
                        onChange={(checked) => handleProductChange(id, checked, productValue)}
                    />
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Thumbnail
                        source={image}
                        size="small"
                        alt={title}
                    />
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        <Text fontWeight="bold" as="span">
                            {title}
                        </Text>
                    </div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text fontWeight="bold" as="span">
                        {price}
                    </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                    <TextField
                        value={productValue}
                        onChange={(text) => handleProductChange(id, isChecked, text)}
                        disabled={!isChecked}
                        placeholder={isChecked ? '0.00' : ''}
                        prefix={isChecked ? shop_currency : undefined}
                    />

                </IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    const filteredProduct = showAllProduct
        ? products
        : products.filter(product => exclude_Rate.productsData.some(selectedProduct => selectedProduct.id === product.id));
    const selectedCount1 = exclude_Rate.productsData.length
    const productData1 = filteredProduct.map(({ id, title, image, price }, index) => {
        return (
            <IndexTable.Row
                id={id}
                key={id}
                position={index}
            >
                <IndexTable.Cell>
                    <Checkbox
                        checked={exclude_Rate.productsData?.some(product => product.id === id) || false}
                        onChange={() => toggleProduct(id, title, price)}
                    />
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Thumbnail
                        source={image}
                        size="small"
                        alt={title}
                    />
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text fontWeight="bold" as="span">
                        {title}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text fontWeight="bold" as="span">
                        {price}
                    </Text>
                </IndexTable.Cell>
            </IndexTable.Row>
        );
    });
    const toggleProduct = (id, title, price) => {
        SetExclude_Rate(prevState => {
            const currentProductData = Array.isArray(prevState.productsData) ? prevState.productsData : [];
            const isSelected = currentProductData.some(product => product.id === id);
            const updatedProductData = isSelected
                ? currentProductData.filter(product => product.id !== id)
                : [...currentProductData, { id, title, price }];
            return { ...prevState, productsData: updatedProductData };
        });
    };

    const handleCheckboxChange2 = (id) => {
        setSelectedProductIds((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((productId) => productId !== id)
                : [...prevSelected, id]
        );
    };
    const selectedCount2 = selectedProductIds.length;
    const productData2 = products.map(({ id, title, image, price }, index) => (
        <IndexTable.Row
            id={id}
            key={id}
            position={index}
        >
            <IndexTable.Cell>
                <Checkbox
                    checked={selectedProductIds.includes(id)}
                    onChange={() => handleCheckboxChange2(id)}
                />
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Thumbnail
                    source={image}
                    size="small"
                    alt={title}
                />
            </IndexTable.Cell>
            <IndexTable.Cell>
                <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Text fontWeight="bold" as="span">
                        {title}
                    </Text>
                </div>
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Text fontWeight="bold" as="span">
                    {price}
                </Text>
            </IndexTable.Cell>
        </IndexTable.Row>
    ));

    if (loading) {
        return (
            <Page
                title={id ? 'Edit Rate' : 'Add Rate'}
                primaryAction={<Button variant="primary"    >Save</Button>}
                secondaryActions={<Button onClick={BacktoZone}>Back</Button>}
            >
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '18%' }}>
                            <SkeletonDisplayText size="small" />
                            <div style={{ paddingTop: '5%', fontSize: '14px' }}>
                                <SkeletonBodyText lines={2} />
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                            <Card roundedAbove="sm">
                                <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                                    <LegacyCard sectioned>
                                        <SkeletonBodyText lines={2} />
                                    </LegacyCard>
                                </div>
                                <Divider borderColor="border" />
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
                </Grid>
            </Page>
        );
    }
    return (
        <Page
            title={id ? 'Edit Rate' : 'Add Rate'}
            primaryAction={<Button variant="primary" onClick={saveRate} loading={loadingButton}>Save</Button>}
            secondaryActions={<Button onClick={() => BacktoZone(zone_id)}>Back</Button>}
        >
            <Divider borderColor="border" />
            <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                <Layout>
                    <Layout.Section variant="oneThird">
                        <div style={{ paddingTop: '10%' }}>
                            <Text variant="headingLg" as="h5">
                                Rate details
                            </Text>
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        Specify which rates should apply in this zone
                                    </List.Item>
                                    {/* <List.Item>
                                       <a href='https://www.youtube.com/embed/43ER3QBDFow' style={{color:"#ff8930"}}>Watch Video Guide</a> 
                                    </List.Item> */}
                                </List>
                            </div>
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
                                    prefix={shop_currency}
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
                                    helpText="The service code should not be the same as the other rates."
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
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        New Condition Scenario
                                    </List.Item>
                                </List>
                            </div>
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
                                    <div>
                                        {items.map((item, index) => (
                                            <div key={item.id}>

                                                <Grid>
                                                    <Grid.Cell columnSpan={{ xs: 2, sm: 3, md: 3, lg: 2, xl: 2 }}>
                                                        <div style={{ paddingTop: '20%', textAlign: 'center', }}>
                                                            <Text variant="headingXs" as="h6">
                                                                {getCategory(item.name)}
                                                            </Text>
                                                        </div>
                                                    </Grid.Cell>
                                                    <Grid.Cell columnSpan={{ xs: 10, sm: 9, md: 9, lg: 10, xl: 10 }}>
                                                        <div>
                                                            <div className='conditions' style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '2%',
                                                                marginTop: "2%",
                                                                marginBottom: "2%"
                                                            }}>
                                                                <Select
                                                                    options={validations}
                                                                    onChange={(newValue) => handleSelectChange(index, newValue, false)}
                                                                    value={item.name}
                                                                />
                                                                {item.name !== 'day' && item.name !== 'localcode' && item.name !== 'name' && item.name !== 'tag' && item.name !== 'sku' && item.name !== 'type' && item.name !== 'vendor' && item.name !== 'properties' && item.name !== 'time' && item.name !== 'name2' && item.name !== 'address' && item.name !== 'addrss1' && item.name !== 'address2' && item.name !== 'address' && item.name !== 'address' && item.name !== 'city' && item.name !== 'provinceCode' && item.name !== 'tag2' && item.name !== 'dayIs' && item.name !== 'type2' && item.name !== 'timeIn' && item.name !== 'dayOfWeek' && item.name !== 'company' && item.name !== 'phone' && item.name !== 'email' && (
                                                                    <Select
                                                                        options={option}
                                                                        onChange={(newValue) => handleSelectChange(index, newValue, true)}
                                                                        value={item.condition}
                                                                    />
                                                                )}
                                                                {(item.name === 'day' || item.name === 'localcode' || item.name === 'provinceCode' || item.name === 'dayOfWeek' || item.name === 'dayIs' || item.name === 'type2') && (
                                                                    <Select
                                                                        options={day}
                                                                        onChange={(newValue) => handleSelectChange(index, newValue, true)}
                                                                        value={item.condition}
                                                                    />
                                                                )}
                                                                {(item.name === 'name' || item.name === 'tag' || item.name === 'sku' || item.name === 'type' || item.name === 'vendor' || item.name === 'properties' || item.name === 'name2' || item.name === 'email' || item.name === 'phone' || item.name === 'company' || item.name === 'addrss1' || item.name === 'address2' || item.name === 'city' || item.name === 'tag2') && (
                                                                    <Select
                                                                        options={name}
                                                                        onChange={(newValue) => handleSelectChange(index, newValue, true)}
                                                                        value={item.condition}
                                                                    />
                                                                )}
                                                                {item.name === 'time' && (
                                                                    <Select
                                                                        options={timeIs}
                                                                        onChange={(newValue) => handleSelectChange(index, newValue, true)}
                                                                        value={item.condition}
                                                                    />
                                                                )}
                                                                {(item.name === 'address' || item.name === 'timeIn') && (
                                                                    <Select
                                                                        options={address}
                                                                        onChange={(newValue) => handleSelectChange(index, newValue, true)}
                                                                        value={item.condition}
                                                                    />
                                                                )}
                                                                {item.name !== 'dayOfWeek' && item.name !== 'type2' && item.name !== 'date' && item.name !== 'dayIs' && item.name !== 'day' && item.name !== 'time' && item.name !== 'timeIn' && (
                                                                    <TextField
                                                                        value={item.value}
                                                                        onChange={(newValue) => handleConditionChange(newValue, index, 'value')}
                                                                        autoComplete="off"
                                                                        suffix={item.unit ? item.unit : ''}
                                                                        error={errors[`value${index}`]}
                                                                    />
                                                                )}
                                                                {item.condition === 'between' && (
                                                                    <div>
                                                                        {item.name !== 'dayOfWeek' && item.name !== 'type2' && item.name !== 'date' && item.name !== 'dayIs' && item.name !== 'day' && item.name !== 'time' && item.name !== 'timeIn' && item.name !== 'name' && item.name !== 'tag' && item.name !== 'sku' && item.name !== 'type' && item.name !== 'vendor' && item.name !== 'properties' && item.name !== 'name2' && item.name !== 'email' && item.name !== 'phone' && item.name !== 'company' && item.name !== 'address' && item.name !== 'addrss1' && item.name !== 'address2' && item.name !== 'city' && item.name !== 'provinceCode' && item.name !== 'Customer' && item.name !== 'localcode' && (
                                                                            <TextField
                                                                                value={item.value2}
                                                                                onChange={(newValue) => handleConditionChange(newValue, index, 'value2')}
                                                                                autoComplete="off"
                                                                                suffix={item.unit ? item.unit : ''}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {item.name === 'dayIs' && (
                                                                    <TextField
                                                                        value={item.value}
                                                                        onChange={(newValue) => handleConditionChange(newValue, index, 'value')}
                                                                        autoComplete="off"
                                                                        placeholder='Delivery X days from today is'
                                                                        error={errors[`value${index}`]}
                                                                    />
                                                                )}
                                                                {item.name === 'time' && (
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10%',
                                                                        marginRight: "3%"
                                                                    }}>
                                                                        <Select
                                                                            key={index}
                                                                            options={time}
                                                                            onChange={handleConditionsChange(index, 'value')}
                                                                            value={item.value}
                                                                        />
                                                                        <Select
                                                                            options={time}
                                                                            key={index}
                                                                            onChange={handleConditionsChange(index, 'value2')}
                                                                            value={item.value2}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {(item.name === 'day' || item.name === 'dayOfWeek') && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                        <Checkbox
                                                                            label="Sunday"
                                                                            checked={dayOfWeekSelection[index].Sunday}
                                                                            onChange={() => handleDayCheckboxChange('Sunday', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Monday"
                                                                            checked={dayOfWeekSelection[index].Monday}
                                                                            onChange={() => handleDayCheckboxChange('Monday', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Tuesday"
                                                                            checked={dayOfWeekSelection[index].Tuesday}
                                                                            onChange={() => handleDayCheckboxChange('Tuesday', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Wednesday"
                                                                            checked={dayOfWeekSelection[index].Wednesday}
                                                                            onChange={() => handleDayCheckboxChange('Wednesday', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Thursday"
                                                                            checked={dayOfWeekSelection[index].Thursday}
                                                                            onChange={() => handleDayCheckboxChange('Thursday', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Friday"
                                                                            checked={dayOfWeekSelection[index].Friday}
                                                                            onChange={() => handleDayCheckboxChange('Friday', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Saturday"
                                                                            checked={dayOfWeekSelection[index].Saturday}
                                                                            onChange={() => handleDayCheckboxChange('Saturday', index)}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {item.name === 'date' && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                        <TextField
                                                                            value={item.value}
                                                                            onChange={(value) => handleItemDateChange(index, 'value', value)}
                                                                            type="date"
                                                                            error={errors[`value${index}`]}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {item.name === 'timeIn' && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                        <TextField
                                                                            value={item.value}
                                                                            onChange={(value) => handleItemDateChange(index, 'value', value)}
                                                                            type="time"
                                                                            error={errors[`value${index}`]}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {item.name === 'type2' && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                        <Checkbox
                                                                            label="Local Delivery"
                                                                            checked={deliveryType[index].local}
                                                                            onChange={() => handleCheckboxChange('local', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Store Pickup"
                                                                            checked={deliveryType[index].Store}
                                                                            onChange={() => handleCheckboxChange('Store', index)}
                                                                        />
                                                                        <Checkbox
                                                                            label="Shipping"
                                                                            checked={deliveryType[index].Shipping}
                                                                            onChange={() => handleCheckboxChange('Shipping', index)}
                                                                        />
                                                                    </div>
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
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '3%',
                                                                marginBottom: "2%",
                                                            }}>
                                                                {item.name === 'lineitem' && (
                                                                    <>
                                                                        <Select
                                                                            options={lineItem}
                                                                            onChange={handleConditionsChange(index, 'lineItem')}
                                                                            value={item.lineItem}
                                                                        />
                                                                        {item.lineItem === 'anyTag' && (
                                                                            <TextField
                                                                                value={item.tag}
                                                                                onChange={(newValue) => handleConditionChange(newValue, index, 'tag')}
                                                                                placeholder='tag1,tag2,tag3'
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {(item.name === 'quantity2' || item.name === 'price' || item.name === 'total2' || item.name === 'weight2') && (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '3%',
                                                                    marginBottom: "2%",
                                                                }}>
                                                                    <Select
                                                                        key={index}
                                                                        options={per_product}
                                                                        onChange={handleConditionsChange(index, 'per_product')}
                                                                        value={item.per_product}
                                                                    />
                                                                    {(item.per_product === 'anyTag' || item.per_product === 'allTag') && (
                                                                        <TextField
                                                                            value={item.tag}
                                                                            onChange={(newValue) => handleConditionChange(newValue, index, 'tag')}
                                                                            placeholder='tag1,tag2,tag3'
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {(item.name === 'name' || item.name === 'tag' || item.name === 'sku' || item.name === 'type' || item.name === 'vendor' || item.name === 'properties') && (
                                                                <div style={{ marginBottom: "2%", width: "80%" }}>
                                                                    <Select
                                                                        key={index}
                                                                        options={per_product2}
                                                                        onChange={handleConditionsChange(index, 'per_product')}
                                                                        value={item.per_product}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Grid.Cell>
                                                </Grid>
                                                <Divider borderColor="border" />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: "2%" }}>
                                        <Button
                                            icon={PlusIcon}
                                            variant='primary'
                                            onClick={handleAddItem}
                                        >
                                            Add Conditions
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
                            <div style={{ marginTop: '4%' }}>
                                <List>
                                    <List.Item>
                                        No need to add All ZipCode if you select states.
                                    </List.Item>
                                    <List.Item>
                                        If you want to exclude the specific Zipcode from that state then you can use exclude ZipCode on Allow Zipcode settings.
                                    </List.Item>
                                    <List.Item>
                                        To format zipcodes/pincodes correctly and remove unnecessary blank space,  <a href="https://sbz.cirkleinc.com/zipcode-formatter.php" target="_blank" style={{ textDecoration: "none", color: "#1e87f0" }}>Click here.</a>
                                    </List.Item>
                                </List>
                            </div>
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
                                        error={errors.zipcodeValue}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: "2%" }}>
                                        <RadioButton
                                            label="Include ZipCodes"
                                            checked={checkstate.selectedZipCode === 'Include'}
                                            id="Include"
                                            name="isInclude"
                                            onChange={() => handlecheckedChange('selectedZipCode', 'Include')}
                                        />
                                        <RadioButton
                                            label="Exclude ZipCodes"
                                            checked={checkstate.selectedZipCode === 'exclude'}
                                            id="exclude"
                                            name="isexcludea"
                                            onChange={() => handlecheckedChange('selectedZipCode', 'exclude')}
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
                        <div style={{ paddingTop: '3%' }}>
                            <Text variant="headingLg" as="h5">
                                Rate Based On/Surcharge
                            </Text>
                            <div style={{ marginTop: "4%" }}>
                                <List type='bullet'>
                                    <List.Item>
                                        Specify rate calculation based on Order Weight, Order Quantity with surcharge value.
                                    </List.Item>
                                    <List.Item>
                                        Surcharge calculation will add on Base Price which is available on top of the page.
                                    </List.Item>
                                </List>
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <Checkbox
                                label="Based On Cart"
                                checked={checkedState.checked1}
                                onChange={() => handleCheckChange('checked1')}
                            />
                            {checkedState.checked1 && (
                                <div style={{ marginTop: "2%" }}>
                                    <Divider borderColor="border" />
                                    <div style={{ marginBottom: "2%" }}></div>
                                    <Text variant="headingSm" as="h6">
                                        By Cart Surcharge
                                    </Text>
                                    <div style={{ display: 'flex', marginTop: "1%" }}>
                                        <div style={{ width: '50%', textAlign: 'left', paddingRight: '10px' }}>
                                            <RadioButton
                                                label="Item Weight"
                                                checked={checkstate.selectedByCart === 'weight'}
                                                id="weight"
                                                name="weight"
                                                onChange={() => handlecheckedChange('selectedByCart', 'weight')}
                                            />
                                        </div>
                                        <div style={{ flex: 1, width: "50%" }}>
                                            <RadioButton
                                                label="Item Qty"
                                                checked={checkstate.selectedByCart === 'Qty'}
                                                id="Qty"
                                                name="Qty"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Qty')}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', }}>
                                        <div style={{ width: '50%', textAlign: 'left', paddingRight: '10px' }}>
                                            <RadioButton
                                                label="Cart Total Percentage"
                                                checked={checkstate.selectedByCart === 'Percentage'}
                                                id="Percentage"
                                                name="Percentage"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Percentage')}
                                            />
                                        </div>
                                        <div style={{ flex: 1, width: "50%" }}>
                                            <RadioButton
                                                label="Based On Distance"
                                                checked={checkstate.selectedByCart === 'Distance'}
                                                id="Distance"
                                                name="Distance"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Distance')}
                                            />
                                        </div>
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

                                    <div style={{ display: 'flex',  marginTop: "1%" }}>
                                        <div style={{ width: '50%', textAlign: 'left', paddingRight: '10px' }}>
                                            <RadioButton
                                                label="Product"
                                                checked={checkstate.selectedByCart === 'Product'}
                                                id="Product"
                                                name="Product"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Product')}
                                            />
                                        </div>
                                        <div style={{ flex: 1, width: "50%" }}>
                                            <RadioButton
                                                label="Vendor"
                                                checked={checkstate.selectedByCart === 'Vendor'}
                                                id="Vendor"
                                                name="Vendor"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Vendor')}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', }}>
                                        <div style={{ width: '50%', textAlign: 'left', paddingRight: '10px' }}>
                                            <RadioButton
                                                label="Variant"
                                                checked={checkstate.selectedByCart === 'Variant'}
                                                id="Variant"
                                                name="Variant"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Variant')}
                                            />
                                        </div>
                                        <div style={{ flex: 1, width: "50%" }}>
                                            <RadioButton
                                                label="Product Tag"
                                                checked={checkstate.selectedByCart === 'Tag'}
                                                id="Tag"
                                                name="Tag"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Tag')}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', }}>
                                        <div style={{ width: '50%', textAlign: 'left', paddingRight: '10px' }}>
                                            <RadioButton
                                                label="Product Type"
                                                checked={checkstate.selectedByCart === 'Type'}
                                                id="Type"
                                                name="Type"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Type')}
                                            />
                                        </div>
                                        <div style={{ flex: 1, width: "50%" }}>
                                            <RadioButton
                                                label="Product SKU"
                                                checked={checkstate.selectedByCart === 'SKU'}
                                                id="SKU"
                                                name="SKU"
                                                onChange={() => handlecheckedChange('selectedByCart', 'SKU')}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', }}>
                                        <div style={{ width: '50%', textAlign: 'left', paddingRight: '10px' }}>
                                            <RadioButton
                                                label="Product Collection Id"
                                                checked={checkstate.selectedByCart === 'Collection'}
                                                id="Collection"
                                                name="Collection"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Collection')}
                                            />
                                        </div>
                                        <div style={{ flex: 1, width: "50%" }}>
                                            <RadioButton
                                                label="Variant Metafields"
                                                checked={checkstate.selectedByCart === 'Metafields'}
                                                id="Metafields"
                                                name="Metafields"
                                                onChange={() => handlecheckedChange('selectedByCart', 'Metafields')}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: "2%" }}></div>
                                    <Divider borderColor="border-inverse" />
                                    <div style={{ marginTop: "3%" }}></div>
                                    {(checkstate.selectedByCart === 'weight' || checkstate.selectedByCart === 'Qty' || checkstate.selectedByCart === 'Distance') && (
                                        <div>
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label={
                                                            checkstate.selectedByCart === 'weight' ? "Charge Per Weight" :
                                                                checkstate.selectedByCart === 'Qty' ? "Charge Per Qty" :
                                                                    "Charge Per Distance"
                                                        }
                                                        autoComplete="off"
                                                        prefix={shop_currency}
                                                        placeholder='0.00'
                                                        value={rate_based_on_surcharge.charge_per_wight}
                                                        onChange={handleRateFormChange('charge_per_wight')}
                                                        error={errors.charge_per_wight}
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label={
                                                            checkstate.selectedByCart === 'weight' ? "Unit For Weight" :
                                                                checkstate.selectedByCart === 'Qty' ? "Unit For Qty" :
                                                                    "Unit For Distance"
                                                        }
                                                        autoComplete="off"
                                                        prefix={
                                                            checkstate.selectedByCart === 'weight' ? "kg" :
                                                                checkstate.selectedByCart === 'Qty' ? "Qty" :
                                                                    "km"
                                                        }
                                                        placeholder={
                                                            checkstate.selectedByCart === 'weight' ? "5.00" :
                                                                checkstate.selectedByCart === 'Qty' ? "0" :
                                                                    "0"
                                                        }
                                                        value={rate_based_on_surcharge.unit_for}
                                                        onChange={handleRateFormChange('unit_for')}
                                                        error={errors.unit_for}
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
                                                        autoComplete="off"
                                                        prefix={shop_currency}
                                                        placeholder='0'
                                                        value={rate_based_on_surcharge.min_charge_price}
                                                        onChange={handleRateFormChange('min_charge_price')}
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Maximum Charge Price"
                                                        autoComplete="off"
                                                        prefix={shop_currency}
                                                        placeholder='0'
                                                        value={rate_based_on_surcharge.max_charge_price}
                                                        onChange={handleRateFormChange('max_charge_price')}
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
                                                    autoComplete="off"
                                                    prefix="%"
                                                    placeholder='0.00'
                                                    value={rate_based_on_surcharge.cart_total_percentage}
                                                    onChange={handleRateFormChange('cart_total_percentage')}
                                                    error={errors.cart_total_percentage}
                                                />
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Minimum Charge Price"
                                                        autoComplete="off"
                                                        prefix={shop_currency}
                                                        placeholder='0'
                                                        value={rate_based_on_surcharge.min_charge_price}
                                                        onChange={handleRateFormChange('min_charge_price')}
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Maximum Charge Price"
                                                        autoComplete="off"
                                                        prefix={shop_currency}
                                                        placeholder='0'
                                                        value={rate_based_on_surcharge.max_charge_price}
                                                        onChange={handleRateFormChange('max_charge_price')}
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
                                                    checked={checkstate.selectedMultiplyLine === 'per'}
                                                    id="pr"
                                                    name="pr"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'per')}
                                                />
                                            </div>
                                            {checkstate.selectedMultiplyLine !== 'no' && (
                                                <div style={{ marginTop: "4%" }}>
                                                    <Divider borderColor="border" />
                                                    {checkstate.selectedMultiplyLine === 'per' && (
                                                        <div style={{ marginTop: "2%" }}>
                                                            <TextField
                                                                type="text"
                                                                label="Cart Total Percentage"
                                                                autoComplete="off"
                                                                placeholder='0.00'
                                                                prefix='%'
                                                                value={rate_based_on_surcharge.cart_total_percentage}
                                                                onChange={handleRateFormChange('cart_total_percentage')}
                                                            />
                                                            <div style={{ marginTop: "2%", marginBottom: "3%" }}>
                                                                <FormLayout>
                                                                    <FormLayout.Group>
                                                                        <TextField
                                                                            type="text"
                                                                            label="Minimum Charge Price"
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                            value={rate_based_on_surcharge.min_charge_price}
                                                                            onChange={handleRateFormChange('min_charge_price')}
                                                                        />
                                                                        <TextField
                                                                            type="text"
                                                                            label="Maximum Charge Price"
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                            value={rate_based_on_surcharge.max_charge_price}
                                                                            onChange={handleRateFormChange('max_charge_price')}
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
                                                                    autoComplete="off"
                                                                    placeholder='Enter Full Product Title'
                                                                    value={textFields.fullProductTitle}
                                                                    onChange={handleTextFieldChange('fullProductTitle')}
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Enter Collection ID"
                                                                    autoComplete="off"
                                                                    placeholder='Enter Collection ID'
                                                                    value={textFields.collectionId}
                                                                    onChange={handleTextFieldChange('collectionId')}
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
                                                                    autoComplete="off"
                                                                    placeholder='Enter Full Product Type'
                                                                    value={textFields.productType}
                                                                    onChange={handleTextFieldChange('productType')}
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Full Product Vendor"
                                                                    autoComplete="off"
                                                                    placeholder='Enter Full Product Vendor'
                                                                    value={textFields.productVendor}
                                                                    onChange={handleTextFieldChange('productVendor')}
                                                                />
                                                            </FormLayout.Group>
                                                        </FormLayout>
                                                    </div>
                                                    <p style={{ marginTop: "2%" }}>Note: Please enter the exact term for product title, collection id, product type, and product vendor that needs to be searched.
                                                    </p>
                                                    <div style={{ marginTop: "2%", width: '20%' }} >
                                                        <Button variant="primary" onClick={handleSearchClick} >Search Product</Button></div>
                                                    <div style={{ marginTop: "4%" }}>
                                                        {filteredProducts.length > 0 && (
                                                            <div>
                                                                <div>
                                                                    <TextField
                                                                        placeholder='search'
                                                                        onChange={handlesearchChange}
                                                                        value={value}
                                                                        type="text"
                                                                        prefix={<Icon source={SearchIcon} color="inkLighter" />}
                                                                        autoComplete="off"
                                                                        clearButton
                                                                        onClearButtonClick={handleClearButtonClick}
                                                                    />
                                                                </div>
                                                                <div style={{ marginTop: "4%" }}>
                                                                    <IndexTable
                                                                        resourceName={resourceName}
                                                                        itemCount={products.length}

                                                                        headings={[
                                                                            { title: ` ${selectedCount} Selected` },
                                                                            { title: 'Image' },
                                                                            { title: 'Title' },
                                                                            { title: 'Price' },
                                                                            { title: 'Rate Price' },
                                                                        ]}
                                                                        selectable={false}
                                                                        pagination={{
                                                                            hasNext: pageInfo.hasNextPage,
                                                                            onNext: handleNextPage,
                                                                            hasPrevious: pageInfo.hasPreviousPage,
                                                                            onPrevious: handlePreviousPage,
                                                                        }}
                                                                    >
                                                                        {loadingTable ? (
                                                                            <IndexTable.Row>
                                                                                <IndexTable.Cell colSpan={5}>
                                                                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                                                                        <Spinner accessibilityLabel="Loading products" size="small" />
                                                                                    </div>
                                                                                </IndexTable.Cell>
                                                                            </IndexTable.Row>
                                                                        ) : (
                                                                            rowMarkup
                                                                        )}

                                                                    </IndexTable>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {(checkstate.selectedByCart === 'Vendor' || checkstate.selectedByCart === 'Tag' || checkstate.selectedByCart === 'Type' || checkstate.selectedByCart === 'SKU' || checkstate.selectedByCart === 'Collection' || checkstate.selectedByCart === 'Metafields') && (
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
                                                    checked={checkstate.selectedMultiplyLine === 'per'}
                                                    id="pr"
                                                    name="pr"
                                                    onChange={() => handlecheckedChange('selectedMultiplyLine', 'per')}
                                                />
                                            </div>
                                            {checkstate.selectedMultiplyLine !== 'no' && (
                                                <div style={{ marginTop: "4%" }}>
                                                    <Divider borderColor="border" />
                                                    {checkstate.selectedMultiplyLine === 'per' && (
                                                        <div style={{ marginTop: "2%" }}>
                                                            <TextField
                                                                type="text"
                                                                label="Cart Total Percentage"
                                                                autoComplete="off"
                                                                placeholder='0.00'
                                                                prefix='%'
                                                                value={rate_based_on_surcharge.cart_total_percentage}
                                                                onChange={handleRateFormChange('cart_total_percentage')}
                                                            />
                                                            <div style={{ marginTop: "2%", marginBottom: "3%" }}>
                                                                <FormLayout>
                                                                    <FormLayout.Group>
                                                                        <TextField
                                                                            type="text"
                                                                            label="Minimum Charge Price"
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                            value={rate_based_on_surcharge.min_charge_price}
                                                                            onChange={handleRateFormChange('min_charge_price')}
                                                                        />
                                                                        <TextField
                                                                            type="text"
                                                                            label="Maximum Charge Price"
                                                                            autoComplete="off"
                                                                            placeholder='0'
                                                                            value={rate_based_on_surcharge.max_charge_price}
                                                                            onChange={handleRateFormChange('max_charge_price')}
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
                                                            label={
                                                                checkstate.selectedByCart === 'Vendor' ? "Vendor Name " :
                                                                    checkstate.selectedByCart === 'Tag' ? "Product Tag" :
                                                                        checkstate.selectedByCart === 'Type' ? "Product Type" :
                                                                            checkstate.selectedByCart === 'SKU' ? 'Product SKU' :
                                                                                checkstate.selectedByCart === 'Collection' ? 'Product Collection ID' :
                                                                                    "Variant Metafields"
                                                            }

                                                            autoComplete="off"
                                                            placeholder=
                                                            {
                                                                `Enter multiple ${checkstate.selectedByCart === 'Vendor' ? 'Vendor Names' : checkstate.selectedByCart === 'Tag' ? 'Product Tags' :
                                                                    checkstate.selectedByCart === 'Type' ? 'Product Type' : checkstate.selectedByCart === 'SKU' ? 'Product SKU' :
                                                                        checkstate.selectedByCart === 'Collection' ? 'Product Collection ID' : 'Variant Metafields'
                                                                }, separated by commas(,).`
                                                            }
                                                            multiline={4}
                                                            monospaced
                                                            helpText={
                                                                `Note: Please enter the exact term of multiple ${checkstate.selectedByCart === 'Vendor' ? 'Vendor Names' : checkstate.selectedByCart === 'Tag' ? 'Product Tags' :
                                                                    checkstate.selectedByCart === 'Type' ? 'Product Type' : checkstate.selectedByCart === 'SKU' ? 'Product SKU' :
                                                                        checkstate.selectedByCart === 'Collection' ? 'Product Collection Id' : 'Variant Metafields'
                                                                } with comma separator(,).`
                                                            }

                                                            value={rate_based_on_surcharge.descriptions}
                                                            onChange={handleRateFormChange('descriptions')}
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
                        <div style={{ paddingTop: '%' }}>
                            <Text variant="headingLg" as="h5">
                                Rate Tier
                            </Text>
                            <div style={{ marginTop: '4%' }}>
                                <List type='bullet'>
                                    <List.Item>Set different Base Rate Price according to order weight, total or qty.</List.Item>
                                    <List.Item>Order price will count without applying the discount code.</List.Item>
                                    <List.Item>When a tier is not found then the system will select the Base Rate which is set on top of the page.</List.Item>
                                </List>
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <div>
                                <Select
                                    options={tierOptions}
                                    onChange={handleTierSelectChange}
                                    value={selectedTierType}
                                    helpText="Note: Please make sure Origin and Destination country must be same to use distance base shipping rate."
                                />
                                {selectedTierType !== 'selected' && (
                                    <div>
                                        <div style={{ marginTop: '2%' }}><Divider borderColor="border" />
                                        </div>
                                        {tiers.map((tier, index) => (
                                            <div style={{ marginTop: '2%' }} key={index}>
                                                <div style={{ marginBottom: "1%", marginLeft: "85%" }}>
                                                    <p style={{ color: "#ef5350", fontWeight: "bold", cursor: "pointer" }} onClick={() => removeTier(index)}>
                                                        Remove Tier
                                                    </p>
                                                </div>
                                                <FormLayout>
                                                    <FormLayout.Group condensed>
                                                        <TextField
                                                            label={`Minimum ${selectedTierType === 'order_weight' ? 'Weight' : selectedTierType === 'order_quantity' ? 'Quantity' : selectedTierType === 'order_distance' ? 'Distance' : 'Price'}`}
                                                            value={tier.minWeight}
                                                            onChange={(value) => handleInputChange(index, 'minWeight', value)}
                                                            autoComplete="off"
                                                            prefix={shop_currency}
                                                            placeholder="0.00"
                                                            error={errors[`minWeight${index}`]}
                                                        />
                                                        <TextField
                                                            label={`Maximum ${selectedTierType === 'order_weight' ? 'Weight' : selectedTierType === 'order_quantity' ? 'Quantity' : selectedTierType === 'order_distance' ? 'Distance' : 'Price'}`}
                                                            value={tier.maxWeight}
                                                            onChange={(value) => handleInputChange(index, 'maxWeight', value)}
                                                            autoComplete="off"
                                                            prefix={shop_currency}
                                                            placeholder="0.00"
                                                            error={errors[`maxWeight${index}`]}
                                                        />
                                                        <TextField
                                                            label='Base Price'
                                                            value={tier.basePrice}
                                                            onChange={(value) => handleInputChange(index, 'basePrice', value)}
                                                            autoComplete="off"
                                                            prefix={shop_currency}
                                                            placeholder="0.00"
                                                            error={errors[`basePrice${index}`]}
                                                        />
                                                    </FormLayout.Group>
                                                </FormLayout>
                                                {selectedTierType === 'order_price' && (
                                                    <div style={{ marginTop: '3%' }}>
                                                        <FormLayout>
                                                            <FormLayout.Group condensed>
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <TextField
                                                                        label='Per Item'
                                                                        value={tier.perItem}
                                                                        onChange={(value) => handleInputChange(index, 'perItem', value)}
                                                                        autoComplete="off"
                                                                        prefix={shop_currency}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <div style={{ padding: '20px 3px 0 3px', fontSize: '18px' }}>+</div>
                                                                    <TextField
                                                                        label='Percent Charge'
                                                                        value={tier.percentCharge}
                                                                        onChange={(value) => handleInputChange(index, 'percentCharge', value)}
                                                                        autoComplete="off"
                                                                        prefix="%"
                                                                        placeholder="0.00"
                                                                    />
                                                                    <div style={{ padding: '20px 3px 0 3px', fontSize: '18px' }}>+</div>
                                                                    <TextField
                                                                        label={`Per ${shop_weight_unit}`}
                                                                        value={tier.perkg}
                                                                        onChange={(value) => handleInputChange(index, 'perkg', value)}
                                                                        autoComplete="off"
                                                                        prefix={shop_currency}
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </FormLayout.Group>
                                                        </FormLayout>
                                                    </div>
                                                )}
                                                <div style={{ marginTop: "3%" }}> <Divider borderColor="border" /></div>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '2%' }}>
                                            <Button
                                                icon={PlusIcon}
                                                onClick={addTier}
                                                variant='primary'
                                            >
                                                Add Tier
                                            </Button>
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
                        <div style={{ paddingTop: '5%', }}>
                            <Text variant="headingLg" as="h5">
                                Exclude rate for products
                            </Text>
                            <div style={{ marginTop: "4%" }}>
                                <List type="bullet">
                                    <List.Item>
                                        If this rate does not set with Set Rate Based On Cart as "Product" then this rate can be exclude for selected products.
                                    </List.Item>
                                    <List.Item>
                                        If any of these products are in the cart, then this rate will not be available at checkout.
                                    </List.Item>
                                </List>
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <Select
                                label='Set Exclude Products'
                                options={rateOptions}
                                onChange={handleRateSelectChange}
                                value={selectedRate}
                            />
                            {selectedRate === 'custome_selection' && (
                                <div >
                                    <div style={{ marginTop: "3%" }}></div>
                                    <Divider borderColor="border" />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10%', marginTop: '2%', marginBottom: "2%" }}>
                                        <RadioButton
                                            label="Remove rate"
                                            checked={checkstate.exclude_products_radio === 0}
                                            id="remove_rate"
                                            name="remove_rate"
                                            onChange={() => handlecheckedChange('exclude_products_radio', 0)}
                                        />
                                        <RadioButton
                                            label="Reduce only product price, weight and quantity"
                                            checked={checkstate.exclude_products_radio === 1}
                                            id="reduce_rate"
                                            name="reduce_rate"
                                            onChange={() => handlecheckedChange('exclude_products_radio', 1)}
                                        />
                                    </div>
                                    <Divider borderColor="border" />
                                    <div style={{ marginTop: "2%" }}>
                                        <FormLayout>
                                            <FormLayout.Group>
                                                <TextField
                                                    type="text"
                                                    label="Full Product Title"
                                                    autoComplete="off"
                                                    placeholder='Enter Full Product Title'
                                                    value={textFields.fullProductTitle}
                                                    onChange={handleTextFieldChange('fullProductTitle')}
                                                />
                                                <TextField
                                                    type="text"
                                                    label="Enter Collection ID"
                                                    autoComplete="off"
                                                    placeholder='Enter Collection ID'
                                                    value={exclude_Rate.collection_id}
                                                    onChange={handleRateFormChange('collection_id')}
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
                                                    autoComplete="off"
                                                    placeholder='Enter Full Product Type'
                                                    value={exclude_Rate.product_type}
                                                    onChange={handleRateFormChange('product_type')}
                                                    helpText=''
                                                />
                                                <TextField
                                                    type="text"
                                                    label="Full Product Vendor"
                                                    autoComplete="off"
                                                    placeholder='Enter Full Product Vendor'
                                                    value={exclude_Rate.product_vendor}
                                                    onChange={handleRateFormChange('product_vendor')}
                                                />
                                            </FormLayout.Group>
                                        </FormLayout>
                                    </div>
                                    <p style={{ marginTop: "1%" }}>Note: Please enter the exact term for product title, collection id, product type, and product vendor that needs to be searched.
                                    </p>
                                    <div style={{ marginTop: "2%", width: '20%' }}>
                                        <Button variant="primary" onClick={handleClick}>Search Product</Button></div>
                                    <div style={{ marginTop: "4%" }}>
                                        <div>
                                            <div>
                                                <TextField
                                                    placeholder='search'
                                                    onChange={handlesearchChange}
                                                    value={value}
                                                    type="text"
                                                    prefix={<Icon source={SearchIcon} color="inkLighter" />}
                                                    autoComplete="off"
                                                    clearButton
                                                    onClearButtonClick={handleClearButtonClick}
                                                />
                                            </div>
                                            <div style={{ marginTop: "4%" }}>
                                                <IndexTable
                                                    resourceName={resourceName}
                                                    itemCount={products.length}

                                                    headings={[
                                                        { title: ` ${selectedCount1} Selected` },
                                                        { title: 'Image' },
                                                        { title: 'Title' },
                                                        { title: 'Price' },

                                                    ]}
                                                    selectable={false}
                                                    pagination={{
                                                        hasNext: pageInfo.hasNextPage,
                                                        onNext: handleNextPage,
                                                        hasPrevious: pageInfo.hasPreviousPage,
                                                        onPrevious: handlePreviousPage,
                                                    }}
                                                >
                                                    {loadingTable ? (
                                                        <IndexTable.Row>
                                                            <IndexTable.Cell colSpan={5}>
                                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                                                    <Spinner accessibilityLabel="Loading products" size="small" />
                                                                </div>
                                                            </IndexTable.Cell>
                                                        </IndexTable.Row>
                                                    ) : (
                                                        productData1
                                                    )}

                                                </IndexTable>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(selectedRate === 'product_vendor' || selectedRate === 'product_sku' || selectedRate === 'product_type' || selectedRate === 'product_properties' || selectedRate === 'product_tag') && (
                                <div>
                                    <div style={{ marginTop: "3%" }}></div>
                                    <Divider borderColor="border" />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10%', marginTop: '2%', marginBottom: "2%" }}>
                                        <RadioButton
                                            label="Remove rate"
                                            checked={checkstate.exclude_products_radio === 0}
                                            id="remove_rate"
                                            name="remove_rate"
                                            onChange={() => handlecheckedChange('exclude_products_radio', 0)}
                                        />
                                        <RadioButton
                                            label="Reduce only product price, weight and quantity"
                                            checked={checkstate.exclude_products_radio === 1}
                                            id="reduce_rate"
                                            name="reduce_rate"
                                            onChange={() => handlecheckedChange('exclude_products_radio', 1)}
                                        />
                                    </div>
                                    <div>
                                        <TextField
                                            placeholder='test1,test2'
                                            multiline={4}
                                            autoComplete="off"
                                            value={exclude_Rate.exclude_products_textbox}
                                            onChange={handleRateFormChange('exclude_products_textbox')}
                                            helpText={
                                                `Note: Please enter the exact term of multiple ${selectedRate === 'product_vendor' ? 'Vendor ' : selectedRate === 'product_sku' ? 'Product SKU' :
                                                    selectedRate === 'product_type' ? 'Product Type' : selectedRate === 'product_tag' ? 'Product Tag' : 'Product Properties'
                                                } with comma separator(,).`
                                            }
                                            error={errors.exclude_products_textbox}
                                        />
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
                                Rate Modifiers
                            </Text>
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        Set different Base Rate Price according to order weight, total price or qty.
                                    </List.Item>
                                </List>
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <div style={{ alignItems: "center" }}>
                            <LegacyCard sectioned>
                                {rateModifiers.map((modifier, index) => (
                                    <div style={{ marginBottom: "3%" }} key={`modifyKey-${modifier.id}-${index}`}>
                                        <Box id={`modify-${modifier.id}`} borderColor="border" borderWidth="025" borderRadius="200">
                                            <div style={{ padding: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Button
                                                        onClick={handleToggle(modifier.id)}
                                                        ariaExpanded={open[modifier.id]}
                                                        ariaControls={`collapsible-${modifier.id}`}
                                                        icon={SelectIcon}
                                                    />
                                                    <p style={{ color: '#ef5350', fontWeight: 'bold', cursor: 'pointer' }}
                                                        onClick={() => handleRemoveRateModifier(modifier.id)}
                                                    >
                                                        Remove Rate Modifier
                                                    </p>
                                                </div>
                                                <Collapsible
                                                    open={open[modifier.id]}
                                                    id={`collapsible-${modifier.id}`}
                                                    transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                                    expandOnPrint
                                                >
                                                    <div style={{ marginTop: "3%" }}></div>
                                                    <Divider borderColor="border" />
                                                    <div style={{ marginTop: "2%" }}>
                                                        <FormLayout>
                                                            <FormLayout.Group>
                                                                <TextField
                                                                    type="text"
                                                                    label="Rate Modifier Name"
                                                                    value={modifier.name}
                                                                    onChange={handleRateModifierChange(modifier.id, 'name')}
                                                                    autoComplete="off"
                                                                    placeholder="Rate Modifier Name"
                                                                    error={errors[`name${index}`]}
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Title"
                                                                    value={modifier.title}
                                                                    onChange={handleRateModifierChange(modifier.id, 'title')}
                                                                    autoComplete="off"
                                                                    placeholder="Rate Modifier Title -Optional"
                                                                    helpText="Text that will be appended to the rate description"
                                                                />
                                                            </FormLayout.Group>
                                                        </FormLayout>
                                                    </div>
                                                    <div style={{ marginTop: '2%' }}>
                                                        <Divider borderColor="border" />
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5%',
                                                            marginTop: '3%',
                                                        }}
                                                    >
                                                        <Text variant="headingXs" as="h6">
                                                            Type:
                                                        </Text>
                                                        <RadioButton
                                                            label="None"
                                                            checked={modifier.type === 'None'}
                                                            id={`None-${modifier.id}`}
                                                            name={`type-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'type')('None')}
                                                        />
                                                        <RadioButton
                                                            label="AND"
                                                            checked={modifier.type === 'AND'}
                                                            id={`AND-${modifier.id}`}
                                                            name={`type-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'type')('AND')}
                                                        />
                                                        <RadioButton
                                                            label="OR"
                                                            checked={modifier.type === 'OR'}
                                                            id={`OR-${modifier.id}`}
                                                            name={`type-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'type')('OR')}
                                                        />
                                                    </div>
                                                    <div style={{ marginTop: '2%' }}></div>
                                                    <FormLayout>
                                                        <FormLayout.Group>
                                                            <Select
                                                                label="Apply this rate modifier when"
                                                                options={rateModifiersOptions}
                                                                value={modifier.rateModifier}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateModifier')}
                                                            />
                                                            {(modifier.rateModifier === 'dayOfOrder' || modifier.rateModifier === 'provinceCode' || modifier.rateModifier === 'zipcode' || modifier.rateModifier === 'collectionsIds' || modifier.rateModifier === 'localCode' || modifier.rateModifier === 'day' || modifier.rateModifier === 'date' || modifier.rateModifier === 'type' || modifier.rateModifier === 'ids') && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={day}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                            {(modifier.rateModifier === 'price' || modifier.rateModifier === 'time' || modifier.rateModifier === 'weight' || modifier.rateModifier === 'distance' || modifier.rateModifier === 'dayFromToday' || modifier.rateModifier === 'estimatedDay' || modifier.rateModifier === 'timefromCurrent' || modifier.rateModifier === 'dayFromToday' || modifier.rateModifier === 'calculateRate') && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={rateTimeOptions}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                            {modifier.rateModifier === 'quantity' && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={rateQuantityOptions}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                            {modifier.rateModifier === 'available' && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={rateAvailableOptions}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                            {modifier.rateModifier === 'availableQuan' && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={rateAvailableQuantity}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                            {(modifier.rateModifier === 'title' || modifier.rateModifier === 'address') && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={address}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                            {(modifier.rateModifier === 'tag' || modifier.rateModifier === 'thirdParty' || modifier.rateModifier === 'name' || modifier.rateModifier === 'city' || modifier.rateModifier === 'tag2' || modifier.rateModifier === 'vendor' || modifier.rateModifier === 'properties' || modifier.rateModifier === 'type2') && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={rateTag}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                            {modifier.rateModifier === 'sku' && (
                                                                <Select
                                                                    label="Select Operator"
                                                                    options={ratesku}
                                                                    value={modifier.rateOperator}
                                                                    onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                                />
                                                            )}
                                                        </FormLayout.Group>
                                                    </FormLayout>
                                                    <div style={{ marginTop: '5%', marginBottom: '3%' }}>
                                                        {(modifier.rateModifier === 'dayOfOrder' || modifier.rateModifier === 'day') && (
                                                            <Select
                                                                options={rateDayOptions}
                                                                value={modifier.rateDay}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                            />
                                                        )}
                                                        {modifier.rateModifier === 'time' && (
                                                            <Select
                                                                options={time}
                                                                value={modifier.rateDay}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                            />
                                                        )}
                                                        {modifier.rateModifier === 'date' && (
                                                            <TextField
                                                                value={modifier.rateDay}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                                type="date"
                                                            />
                                                        )}
                                                        {modifier.rateModifier === 'ids' && (
                                                            <TextField
                                                                type='text'
                                                                value={modifier.productData
                                                                    ? modifier.productData.map(product => product.id).join(',')
                                                                    : ''}
                                                                onChange={handleRateModifierChange(modifier.id, 'productData')}
                                                                multiline={4}
                                                                onFocus={() => handleFocus(modifier.id)}
                                                                helpText='Add product IDs with comma(,) separator'
                                                            />
                                                        )}
                                                        {(modifier.rateModifier === 'price' || modifier.rateModifier === 'calculateRate' || modifier.rateModifier === 'weight' || modifier.rateModifier === 'quantity' || modifier.rateModifier === 'distance' || modifier.rateModifier === 'localCode' || modifier.rateModifier === 'dayFromToday' || modifier.rateModifier === 'estimatedDay' || modifier.rateModifier === 'timefromCurrent' || modifier.rateModifier === 'availableQuan') && (
                                                            <TextField
                                                                type="number"
                                                                value={modifier.rateDay}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                                autoComplete="off"
                                                                placeholder={
                                                                    modifier.rateModifier === 'price' ? "Price" :
                                                                        modifier.rateModifier === 'weight' ? "Weight" :
                                                                            modifier.rateModifier === 'quantity' ? "Quantity" :
                                                                                modifier.rateModifier === 'distance' ? "Distance" :
                                                                                    modifier.rateModifier === 'dayFromToday' ? "Order Delivery X day from today is" :
                                                                                        modifier.rateModifier === 'timefromCurrent' ? "Order Delivery X hours from current is" :
                                                                                            modifier.rateModifier === 'estimatedDay' ? "Estimated Delivery day" :
                                                                                                modifier.rateModifier === 'availableQuan' ? "Quantity" :
                                                                                                    modifier.rateModifier === 'calculateRate' ? "Calculate Rate Price" :
                                                                                                        "Local Code"
                                                                }
                                                            />
                                                        )}
                                                        {modifier.rateModifier === 'type' && (
                                                            <Select
                                                                options={type}
                                                                value={modifier.rateDay}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                            />
                                                        )}
                                                        {modifier.rateModifier === 'available' && (
                                                            <Select
                                                                options={firstAvailableDay}
                                                                value={modifier.rateDay}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                            />
                                                        )}
                                                        {(modifier.rateModifier === 'title' || modifier.rateModifier === 'thirdParty' || modifier.rateModifier === 'tag2' || modifier.rateModifier === 'address' || modifier.rateModifier === 'provinceCode' || modifier.rateModifier === 'city' || modifier.rateModifier === 'tag' || modifier.rateModifier === 'sku' || modifier.rateModifier === 'type2' || modifier.rateModifier === 'properties' || modifier.rateModifier === 'vendor' || modifier.rateModifier === 'collectionsIds' || modifier.rateModifier === 'zipcode' || modifier.rateModifier === 'name') && (
                                                            <TextField
                                                                type="text"
                                                                value={modifier.rateDay}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                                autoComplete="off"
                                                                multiline={4}
                                                                placeholder={
                                                                    modifier.rateModifier === 'title' ? "Title" :
                                                                        modifier.rateModifier === 'tag' ? "Tag1,Tag2" :
                                                                            modifier.rateModifier === 'sku' ? "sku1,sku2" :
                                                                                modifier.rateModifier === 'type2' ? "type1,type2" :
                                                                                    modifier.rateModifier === 'properties' ? "key:value,key:value" :
                                                                                        modifier.rateModifier === 'vendor' ? "vendor1,vendor2" :
                                                                                            modifier.rateModifier === 'name' ? "Enter Name" :
                                                                                                modifier.rateModifier === 'city' ? "Enter city" :
                                                                                                    modifier.rateModifier === 'provinceCode' ? "Enter Province Code" :
                                                                                                        modifier.rateModifier === 'address' ? "Enter Address" :
                                                                                                            modifier.rateModifier === 'tag' ? "Enter Tag" :
                                                                                                                modifier.rateModifier === 'zipcode' ? "364001,364002,364003" :
                                                                                                                    modifier.rateModifier === 'thirdParty' ? "services1,services2" :
                                                                                                                        "6557955412548511244"
                                                                }
                                                                helpText={
                                                                    modifier.rateModifier === 'title' ? "contains exact match product title with comma(,) seprator" :
                                                                        modifier.rateModifier === 'tag' ? "add exact product tag with comma(,) separator" :
                                                                            modifier.rateModifier === 'sku' ? "add exact product sku with comma(,) separator" :
                                                                                modifier.rateModifier === 'type2' ? "add exact product type with comma(,) separator" :
                                                                                    modifier.rateModifier === 'properties' ? "Add produt property like key:value" :
                                                                                        modifier.rateModifier === 'vendor' ? "add exactvendor name with comma(,) separator" :
                                                                                            modifier.rateModifier === 'zipcode' ? "exact match zip codes with comma(,) separator" :
                                                                                                modifier.rateModifier === 'name' ? "contains match customer name with comma(,) separator" :
                                                                                                    modifier.rateModifier === 'city' ? "contains match customer city with comma(,) separator" :
                                                                                                        modifier.rateModifier === 'provinceCode' ? "Customer province code with comma(,) separator" :
                                                                                                            modifier.rateModifier === 'address' ? "contains match customer address with comma(,) separator" :
                                                                                                                modifier.rateModifier === 'tag2' ? "contains match customer address with comma(,) separator" :
                                                                                                                    modifier.rateModifier === 'thirdParty' ? "add exact third party services with comma(,) separator" :
                                                                                                                        "add collection ids with comma(,) separator"}
                                                            />
                                                        )}
                                                    </div>



                                                    {(modifier.type === 'AND' || modifier.type === 'OR') && (
                                                        <div style={{ marginTop: '5%' }}>
                                                            <div style={{ float: 'left', width: '45%', marginTop: "0.5%" }}><hr /></div>
                                                            <div style={{ float: 'right', width: '45%', marginTop: "0.5%" }}><hr /></div>
                                                            <p style={{ textAlign: "center" }}>{modifier.type} </p>
                                                            <div style={{ marginTop: '4%' }}></div>
                                                            <FormLayout>
                                                                <FormLayout.Group>
                                                                    <Select
                                                                        label="Apply this rate modifier when"
                                                                        options={rateModifiersOptions}
                                                                        value={modifier.rateModifier2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateModifier2')}
                                                                    />
                                                                    {(modifier.rateModifier2 === 'dayOfOrder' || modifier.rateModifier2 === 'provinceCode' || modifier.rateModifier2 === 'zipcode' || modifier.rateModifier2 === 'collectionsIds' || modifier.rateModifier2 === 'localCode' || modifier.rateModifier2 === 'day' || modifier.rateModifier2 === 'date' || modifier.rateModifier2 === 'type' || modifier.rateModifier2 === 'ids') && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={day}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                    {(modifier.rateModifier2 === 'price' || modifier.rateModifier2 === 'time' || modifier.rateModifier2 === 'weight' || modifier.rateModifier2 === 'distance' || modifier.rateModifier2 === 'dayFromToday' || modifier.rateModifier2 === 'estimatedDay' || modifier.rateModifier2 === 'timefromCurrent' || modifier.rateModifier2 === 'dayFromToday' || modifier.rateModifier2 === 'calculateRate') && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={rateTimeOptions}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                    {modifier.rateModifier2 === 'quantity' && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={rateQuantityOptions}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                    {modifier.rateModifier2 === 'available' && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={rateAvailableOptions}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                    {modifier.rateModifier2 === 'availableQuan' && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={rateAvailableQuantity}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                    {(modifier.rateModifier2 === 'title' || modifier.rateModifier2 === 'address') && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={address}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                    {(modifier.rateModifier2 === 'tag' || modifier.rateModifier2 === 'thirdParty' || modifier.rateModifier2 === 'name' || modifier.rateModifier2 === 'city' || modifier.rateModifier2 === 'tag2' || modifier.rateModifier2 === 'vendor' || modifier.rateModifier2 === 'properties' || modifier.rateModifier2 === 'type2') && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={rateTag}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                    {modifier.rateModifier2 === 'sku' && (
                                                                        <Select
                                                                            label="Select Operator"
                                                                            options={ratesku}
                                                                            value={modifier.rateOperator2}
                                                                            onChange={handleRateModifierChange(modifier.id, 'rateOperator2')}
                                                                        />
                                                                    )}
                                                                </FormLayout.Group>
                                                            </FormLayout>
                                                            <div style={{ marginTop: '5%', marginBottom: '3%' }}>
                                                                {(modifier.rateModifier2 === 'dayOfOrder' || modifier.rateModifier2 === 'day') && (
                                                                    <Select
                                                                        options={rateDayOptions}
                                                                        value={modifier.rateDay2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateDay2')}
                                                                    />
                                                                )}
                                                                {modifier.rateModifier2 === 'time' && (
                                                                    <Select
                                                                        options={time}
                                                                        value={modifier.rateDay2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateDay2')}
                                                                    />
                                                                )}
                                                                {modifier.rateModifier2 === 'date' && (
                                                                    <TextField
                                                                        value={modifier.rateDay2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateDay2')}
                                                                        type="date"
                                                                    />
                                                                )}
                                                                {modifier.rateModifier2 === 'ids' && (
                                                                    <TextField
                                                                        type='text'
                                                                        value={modifier.productData ? String(modifier.productData) : ''}
                                                                        onChange={handleRateModifierChange(modifier.id, 'productData')}
                                                                        multiline={4}
                                                                        onFocus={handleFocus}
                                                                        helpText='add product ids with comma(,) separator'
                                                                    />

                                                                )}
                                                                {(modifier.rateModifier2 === 'price' || modifier.rateModifier2 === 'calculateRate' || modifier.rateModifier2 === 'weight' || modifier.rateModifier2 === 'quantity' || modifier.rateModifier2 === 'distance' || modifier.rateModifier2 === 'localCode' || modifier.rateModifier2 === 'dayFromToday' || modifier.rateModifier2 === 'estimatedDay' || modifier.rateModifier2 === 'timefromCurrent' || modifier.rateModifier2 === 'availableQuan') && (
                                                                    <TextField
                                                                        type="number"
                                                                        value={modifier.rateDay2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateDay2')}
                                                                        autoComplete="off"
                                                                        placeholder={
                                                                            modifier.rateModifier2 === 'price' ? "Price" :
                                                                                modifier.rateModifier2 === 'weight' ? "Weight" :
                                                                                    modifier.rateModifier2 === 'quantity' ? "Quantity" :
                                                                                        modifier.rateModifier2 === 'distance' ? "Distance" :
                                                                                            modifier.rateModifier2 === 'dayFromToday' ? "Order Delivery X day from today is" :
                                                                                                modifier.rateModifier2 === 'timefromCurrent' ? "Order Delivery X hours from current is" :
                                                                                                    modifier.rateModifier2 === 'estimatedDay' ? "Estimated Delivery day" :
                                                                                                        modifier.rateModifier2 === 'availableQuan' ? "Quantity" :
                                                                                                            modifier.rateModifier2 === 'calculateRate' ? "Calculate Rate Price" :
                                                                                                                "Local Code"
                                                                        }
                                                                    />
                                                                )}
                                                                {modifier.rateModifier2 === 'type' && (
                                                                    <Select
                                                                        options={type}
                                                                        value={modifier.rateDay2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateDay2')}
                                                                    />
                                                                )}
                                                                {modifier.rateModifier2 === 'available' && (
                                                                    <Select
                                                                        options={firstAvailableDay}
                                                                        value={modifier.rateDay2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateDay2')}
                                                                    />
                                                                )}
                                                                {(modifier.rateModifier2 === 'title' || modifier.rateModifier2 === 'thirdParty' || modifier.rateModifier2 === 'tag2' || modifier.rateModifier2 === 'address' || modifier.rateModifier2 === 'provinceCode' || modifier.rateModifier2 === 'city' || modifier.rateModifier2 === 'tag' || modifier.rateModifier2 === 'sku' || modifier.rateModifier2 === 'type2' || modifier.rateModifier2 === 'properties' || modifier.rateModifier2 === 'vendor' || modifier.rateModifier2 === 'collectionsIds' || modifier.rateModifier2 === 'zipcode' || modifier.rateModifier2 === 'name') && (
                                                                    <TextField
                                                                        type="text"
                                                                        value={modifier.rateDay2}
                                                                        onChange={handleRateModifierChange(modifier.id, 'rateDay2')}
                                                                        autoComplete="off"
                                                                        multiline={4}
                                                                        placeholder={
                                                                            modifier.rateModifier2 === 'title' ? "Title" :
                                                                                modifier.rateModifier2 === 'tag' ? "Tag1,Tag2" :
                                                                                    modifier.rateModifier2 === 'sku' ? "sku1,sku2" :
                                                                                        modifier.rateModifier2 === 'type2' ? "type1,type2" :
                                                                                            modifier.rateModifier2 === 'properties' ? "key:value,key:value" :
                                                                                                modifier.rateModifier2 === 'vendor' ? "vendor1,vendor2" :
                                                                                                    modifier.rateModifier2 === 'name' ? "Enter Name" :
                                                                                                        modifier.rateModifier2 === 'city' ? "Enter city" :
                                                                                                            modifier.rateModifier2 === 'provinceCode' ? "Enter Province Code" :
                                                                                                                modifier.rateModifier2 === 'address' ? "Enter Address" :
                                                                                                                    modifier.rateModifier2 === 'tag' ? "Enter Tag" :
                                                                                                                        modifier.rateModifier2 === 'zipcode' ? "364001,364002,364003" :
                                                                                                                            modifier.rateModifier2 === 'thirdParty' ? "services1,services2" :
                                                                                                                                "6557955412548511244"
                                                                        }
                                                                        helpText={
                                                                            modifier.rateModifier2 === 'title' ? "contains exact match product title with comma(,) seprator" :
                                                                                modifier.rateModifier2 === 'tag' ? "add exact product tag with comma(,) separator" :
                                                                                    modifier.rateModifier2 === 'sku' ? "add exact product sku with comma(,) separator" :
                                                                                        modifier.rateModifier2 === 'type2' ? "add exact product type with comma(,) separator" :
                                                                                            modifier.rateModifier2 === 'properties' ? "Add produt property like key:value" :
                                                                                                modifier.rateModifier2 === 'vendor' ? "add exactvendor name with comma(,) separator" :
                                                                                                    modifier.rateModifier2 === 'zipcode' ? "exact match zip codes with comma(,) separator" :
                                                                                                        modifier.rateModifier2 === 'name' ? "contains match customer name with comma(,) separator" :
                                                                                                            modifier.rateModifier2 === 'city' ? "contains match customer city with comma(,) separator" :
                                                                                                                modifier.rateModifier2 === 'provinceCode' ? "Customer province code with comma(,) separator" :
                                                                                                                    modifier.rateModifier2 === 'address' ? "contains match customer address with comma(,) separator" :
                                                                                                                        modifier.rateModifier2 === 'tag2' ? "contains match customer address with comma(,) separator" :
                                                                                                                            modifier.rateModifier2 === 'thirdParty' ? "add exact third party services with comma(,) separator" :
                                                                                                                                "add collection ids with comma(,) separator"}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <Divider borderColor="border" />
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5%',
                                                            marginTop: '3%',
                                                            marginBottom: '3%',
                                                        }}
                                                    >
                                                        <Text variant="headingXs" as="h6">
                                                            Behaviour:
                                                        </Text>
                                                        <RadioButton
                                                            label="Stack"
                                                            checked={modifier.behaviour === 'Stack'}
                                                            id={`Stack-${modifier.id}`}
                                                            name={`behaviour-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'behaviour')('Stack')}
                                                        />
                                                        <RadioButton
                                                            label="Terminate"
                                                            checked={modifier.behaviour === 'Terminate'}
                                                            id={`Terminate-${modifier.id}`}
                                                            name={`behaviour-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'behaviour')('Terminate')}
                                                        />
                                                    </div>
                                                    <Divider borderColor="border" />
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '2%',
                                                            marginTop: '3%',
                                                            marginBottom: '3%',
                                                        }}
                                                    >
                                                        <Text variant="headingXs" as="h6">
                                                            Modifier Type:
                                                        </Text>
                                                        <RadioButton
                                                            label="Fixed"
                                                            checked={modifier.modifierType === 'Fixed'}
                                                            id={`Fixed-${modifier.id}`}
                                                            name={`modifierType-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'modifierType')('Fixed')}
                                                        />
                                                        <RadioButton
                                                            label="Percentage"
                                                            checked={modifier.modifierType === 'Percentage'}
                                                            id={`Percentage-${modifier.id}`}
                                                            name={`modifierType-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'modifierType')('Percentage')}
                                                        />
                                                        <RadioButton
                                                            label="Static"
                                                            checked={modifier.modifierType === 'Static'}
                                                            id={`Static-${modifier.id}`}
                                                            name={`modifierType-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'modifierType')('Static')}
                                                        />
                                                        <RadioButton
                                                            label="Remove Rate"
                                                            checked={modifier.modifierType === 'RemoveRate'}
                                                            id={`RemoveRate-${modifier.id}`}
                                                            name={`modifierType-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'modifierType')('RemoveRate')}
                                                        />
                                                        <RadioButton
                                                            label="Show Only"
                                                            checked={modifier.modifierType === 'ShowOnly'}
                                                            id={`ShowOnly-${modifier.id}`}
                                                            name={`modifierType-${modifier.id}`}
                                                            onChange={() => handleRateModifierChange(modifier.id, 'modifierType')('ShowOnly')}
                                                        />
                                                    </div>
                                                    {modifier.modifierType !== 'Static' && modifier.modifierType !== 'RemoveRate' && modifier.modifierType !== 'ShowOnly' && (
                                                        <div>
                                                            <Divider borderColor="border" />
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                marginTop: '2%',
                                                                marginBottom: '2%',
                                                                justifyContent: "space-between"
                                                            }}>
                                                                <Text variant="headingXs" as="h6">
                                                                    Effect :
                                                                </Text>
                                                                <RadioButton
                                                                    label="Increase"
                                                                    checked={modifier.effect === 'Increase'}
                                                                    id={`Increase-${modifier.id}`}
                                                                    name={`effect-${modifier.id}`}
                                                                    onChange={() =>
                                                                        handleRateModifierChange(modifier.id, 'effect')('Increase')
                                                                    }
                                                                />
                                                                <RadioButton
                                                                    label="Decrease"
                                                                    checked={modifier.effect === 'Decrease'}
                                                                    id={`Decrease-${modifier.id}`}
                                                                    name={`effect-${modifier.id}`}
                                                                    onChange={() =>
                                                                        handleRateModifierChange(modifier.id, 'effect')('Decrease')
                                                                    }
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Adjustment"
                                                                    value={modifier.adjustment}
                                                                    onChange={handleRateModifierChange(modifier.id, 'adjustment')}
                                                                    autoComplete="off"
                                                                    placeholder="00"
                                                                    error={errors[`adjustment${modifier.id}`]}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {modifier.modifierType === 'Static' && (
                                                        <div style={{
                                                            marginTop: '2%',
                                                            marginBottom: '2%',
                                                        }}>
                                                            <div style={{ marginBottom: "2%" }}>
                                                                <Divider borderColor="border" />
                                                            </div>
                                                            <FormLayout>
                                                                <TextField
                                                                    type="text"
                                                                    label="Adjustment"
                                                                    value={modifier.adjustment}
                                                                    onChange={handleRateModifierChange(modifier.id, 'adjustment')}
                                                                    autoComplete="off"
                                                                    placeholder="00"
                                                                    error={errors[`adjustment${index}`]}
                                                                />
                                                            </FormLayout>
                                                        </div>
                                                    )}
                                                </Collapsible>
                                            </div>
                                        </Box>
                                    </div>
                                ))}
                                <div style={{ marginTop: "3%" }}>
                                    <Button variant='primary' icon={PlusIcon} onClick={handleAddRateModifier}>Add Rate Modifier</Button>
                                </div>
                            </LegacyCard>
                        </div>
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
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        We recommend using the same Shipping Tag for all related Shipping rates when merge shipping rates.
                                    </List.Item>
                                </List>
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <LegacyCard sectioned>
                            <TextField
                                label="Merge rate tag"
                                value={formData.merge_rate_tag || ''}
                                onChange={handleRateFormChange('merge_rate_tag')}
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
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        Rate applies on selected locations
                                    </List.Item>
                                </List>
                            </div>
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
                                            {locations.map(location => {
                                                return (
                                                    <div key={location.id} style={{ width: '50%', height: '5%', padding: '5px' }}>
                                                        <LegacyCard>
                                                            <div style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
                                                                <Checkbox
                                                                    checked={!!checkedlocation[location.name]?.checked}
                                                                    onChange={() => handleLocationChange(location)}
                                                                />
                                                                <div style={{ marginLeft: '5%' }}>
                                                                    <h2>{location.name}</h2>
                                                                    <p>{location.address1 || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </LegacyCard>
                                                    </div>
                                                );
                                            })}
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
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        This rate is only available on a specific date & time
                                    </List.Item>
                                </List>
                            </div>
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
                                    checked={checkstate.selectedByschedule === 1}
                                    id="Yess"
                                    name="Yess"
                                    onChange={() => handlecheckedChange('selectedByschedule', 1)}
                                />
                                <RadioButton
                                    label="No"
                                    checked={checkstate.selectedByschedule === 0}
                                    id="No"
                                    name="No"
                                    onChange={() => handlecheckedChange('selectedByschedule', 0)}
                                />
                            </div>
                            {checkstate.selectedByschedule === 1 && (
                                <FormLayout>
                                    <FormLayout.Group>
                                        <TextField
                                            label="Start Date"
                                            value={date.startDate}
                                            onChange={(value) => handleDateChange('startDate', value)}
                                            type="datetime-local"
                                        />
                                        <TextField
                                            label="End Date"
                                            value={date.endDate}
                                            onChange={(value) => handleDateChange('endDate', value)}
                                            type="datetime-local"
                                        />
                                    </FormLayout.Group>
                                    {date.error && <p message={date.error} fieldID="endDate" >{date.error}</p>}
                                </FormLayout>
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
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        By selecting the Send Another Rate option it will allow to set another additional rate.
                                    </List.Item>
                                </List>
                            </div>
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
                                                    value={send_another_rate.another_rate_name}
                                                    onChange={handleRateFormChange('another_rate_name')}
                                                    autoComplete="off"
                                                    required
                                                    placeholder='Enter Rate Name'
                                                    error={errors.another_rate_name}
                                                />
                                                <TextField
                                                    type="text"
                                                    label="Another Rate Description"
                                                    value={send_another_rate.another_rate_description}
                                                    onChange={handleRateFormChange('another_rate_description')}
                                                    autoComplete="off"
                                                    required
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
                                                checked={checkstate.selectedByUpdatePriceType === 0}
                                                id="Fixe"
                                                name="Fixe"
                                                onChange={() => handlecheckedChange('selectedByUpdatePriceType', 0)}
                                            />
                                            <RadioButton
                                                label="Percentage"
                                                checked={checkstate.selectedByUpdatePriceType === 1}
                                                id="Pr"
                                                name="Pr"
                                                onChange={() => handlecheckedChange('selectedByUpdatePriceType', 1)}
                                            />
                                            <RadioButton
                                                label="Static"
                                                checked={checkstate.selectedByUpdatePriceType === 2}
                                                id="Statics"
                                                name="Static"
                                                onChange={() => handlecheckedChange('selectedByUpdatePriceType', 2)}
                                            />
                                        </div>
                                        <div style={{ marginTop: '3%' }}>
                                            <Divider borderColor="border" />
                                        </div>
                                        {checkstate.selectedByUpdatePriceType !== 2 && (
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
                                                                    checked={checkstate.selectedByUpdatePriceEffect === 0}
                                                                    id="increase"
                                                                    name="increase"
                                                                    onChange={() => handlecheckedChange('selectedByUpdatePriceEffect', 0)}
                                                                />
                                                                <RadioButton
                                                                    label="Decrease"
                                                                    checked={checkstate.selectedByUpdatePriceEffect === 1}
                                                                    id="decrease"
                                                                    name="decrease"
                                                                    onChange={() => handlecheckedChange('selectedByUpdatePriceEffect', 1)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <TextField
                                                            type="text"
                                                            label="Adjustment Price"
                                                            value={send_another_rate.adjustment_price}
                                                            onChange={handleRateFormChange('adjustment_price')}
                                                            autoComplete="off"
                                                            error={errors.adjustment_price}
                                                            placeholder='00'
                                                        />
                                                    </FormLayout.Group>
                                                </FormLayout>
                                            </div>
                                        )}
                                        {checkstate.selectedByUpdatePriceType === 2 && (
                                            <div>
                                                <TextField
                                                    type="text"
                                                    label="Adjustment Price"
                                                    value={send_another_rate.adjustment_price}
                                                    onChange={handleRateFormChange('adjustment_price')}
                                                    autoComplete="off"
                                                    error={errors.adjustment_price}
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
                                                        value={send_another_rate.another_service_code}
                                                        onChange={handleRateFormChange('another_service_code')}
                                                        autoComplete="off"
                                                        placeholder='Enter Service Code'
                                                    />
                                                    <TextField
                                                        type="text"
                                                        label="Another merge rate tag"
                                                        value={send_another_rate.another_merge_rate_tag}
                                                        onChange={handleRateFormChange('another_merge_rate_tag')}
                                                        autoComplete="off"
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
            {errorToast && (
                <Toast content={toastContent} error duration={toastDuration} onDismiss={() => setErroToast(false)} />
            )}
            {toastActive && (
                <Toast content={toastMessage} error onDismiss={toggleToastActive} />
            )}
            {isModalOpen && (
                <Modal
                    open={isModalOpen}
                    onClose={handleModalClose}
                    title="My Shopify Modal"
                    primaryAction={{
                        content: 'Add',
                        onAction: handleModalClose,
                        disabled: selectedProductIds.length === 0,
                    }}
                    secondaryActions={[
                        {
                            content: 'Cancel',
                            onAction: handleModalClose,
                        },
                    ]}
                >
                    <Modal.Section>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                <TextField
                                    placeholder='search'
                                    onChange={handlesearchChange}
                                    value={value}
                                    type="text"
                                    prefix={<Icon source={SearchIcon} color="inkLighter" />}
                                    autoComplete="off"
                                    clearButton
                                    onClearButtonClick={handleClearButtonClick}
                                />
                            </div>
                            <div style={{ marginTop: '4%', height: '400px', overflowY: 'scroll' }}>
                                <IndexTable
                                    resourceName={resourceName}
                                    itemCount={products.length}
                                    headings={[
                                        { title: ` ${selectedCount2} Selected` },
                                        { title: 'Image' },
                                        { title: 'Title' },
                                        { title: 'Price' },
                                    ]}
                                    selectable={false}
                                    pagination={{
                                        hasNext: pageInfo.hasNextPage,
                                        onNext: handleNextPage,
                                        hasPrevious: pageInfo.hasPreviousPage,
                                        onPrevious: handlePreviousPage,
                                    }}
                                >
                                    {loadingTable ? (
                                        <IndexTable.Row>
                                            <IndexTable.Cell colSpan={5}>
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                                    <Spinner accessibilityLabel="Loading products" size="small" />
                                                </div>
                                            </IndexTable.Cell>
                                        </IndexTable.Row>
                                    ) : (
                                        productData2
                                    )}
                                </IndexTable>
                            </div>
                        </div>
                    </Modal.Section>
                </Modal>

            )}

        </Page>
    )
}

export default Rate
