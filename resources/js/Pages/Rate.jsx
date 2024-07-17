import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
    DatePicker,
    Layout,
    useIndexResourceState,
    IndexTable,
    Thumbnail,
    Icon,
    Box,
    Collapsible,
    List,
} from '@shopify/polaris';
import { DeleteIcon, PlusIcon, SearchIcon, SelectIcon } from '@shopify/polaris-icons';
import '../../../public/css/style.css';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
import '../../../public/css/style.css';
import Settings from './Settings';

const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function Rate(props) {
    const { rate_id, zone_id } = useParams();
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState([])
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [zipcodeValue, setZipcodeValue] = useState('');
    const navigate = useNavigate();
    const [product, setProduct] = useState();
    const [checkstate, setCheckState] = useState({
        selectedCondition: 0,
        selectedStateCondition: 'All',
        selectedByCart: 'weight',
        selectedByschedule: 0,
        selectedByAmount: 'unit',
        selectedByUpdatePriceType: 0,
        selectedByUpdatePriceEffect: 0,
        selectedZipCondition: 'All',
        selectedZipCode: 'Exclude',
        selectedMultiplyLine: 'Yes',
        selectedPriceReplace: 'BasePrice',
        exclude_products_radio: 0, // 0=Remove rate  1=Reduce only product price, weight and quantity
        type: 'None',
        Behaviour: 'Stack'
    });
    const handlecheckedChange = (key, value) => {
        setCheckState(prevState => ({ ...prevState, [key]: value }));
    };

    const [toastDuration, setToastDuration] = useState(3000);
    const [showToast, setShowToast] = useState(false);
    const [errorToast, setErroToast] = useState(false)
    const [toastContent, setToastContent] = useState("");
    const [errors, setErrors] = useState({});
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [locations, setLocations] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [value, setValue] = useState('');



    const [startCursor, setStartCursor] = useState('');
    const [endCursor, setEndCursor] = useState('');
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [dates, setDates] = useState({ startDate: '', endDate: '', date: '' });
    const handleDateChange = (key, value) => {
        setDates(prevDates => ({
            ...prevDates,
            [key]: value,
        }));
    };
    const [selectedTierType, setSelectedTierType] = useState('selected');
    const [tiers, setTiers] = useState([
        { minWeight: '', maxWeight: '', basePrice: '' }
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
    };

    const tierOptions = [
        { label: 'Select Tier Type' },
        { label: 'Order Price', value: 'order_price' },
        { label: 'Order Weight', value: 'order_weight' },
        { label: 'Order Quantity', value: 'order_quantity' },
        { label: 'Order Distance', value: 'order_distance' }
    ];

    const [selectedRate, setSelectedRate] = useState('selected');
    const handleRateSelectChange = (value) => {
        setSelectedRate(value);
    };
    const rateOptions = [
        { label: 'Set Exclude Products Option', value: 'selected' },
        { label: 'Custome Selection', value: 'custome_selection' },
        { label: 'Product Vendor', value: 'product_vendor' },
        { label: 'Product SKU', value: 'product_sku' },
        { label: 'Product Type', value: 'product_type' },
        { label: 'Product Properties', value: 'product_properties' }
    ];
    useEffect(() => {
        SetExclude_Rate(prevState => ({
            ...prevState,
            set_exclude_products: selectedRate,
        }));
    }, [selectedRate]);

    const [rateModifiers, setRateModifiers] = useState([]);
    const [open, setOpen] = useState({});

    const handleToggle = (id) => () => {
        setOpen((prevState) => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };


    const handleAddRateModifier = () => {
        const newId = rateModifiers.length ? rateModifiers[rateModifiers.length - 1].id + 1 : 1;
        setRateModifiers((prevModifiers) => [
            ...prevModifiers,
            {
                id: newId,
                name: '',
                title: '',
                rateModifier: 'dayOfOrder',
                rateOperator: 'equals',
                rateDay: 'selected',
                type: 'None',
                behaviour: 'Stack',
                modifierType: 'Fixed',
                adjustment: '',
                effect: 'Decrease'
            },
        ]);
        setOpen((prevState) => ({
            ...prevState,
            [newId]: true,
        }));
    };

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
        setRateModifiers((prevModifiers) =>
            prevModifiers.map((modifier) =>
                modifier.id === id ? { ...modifier, [field]: value } : modifier
            )
        );
    };

    const rateModifiersOptions = [
        { label: ' Order', value: '', disabled: true, className: 'select-header' },
        { label: 'Day of Order is', value: 'dayOfOrder' },
        { label: 'Time', value: 'time' },
        { label: 'Price', value: 'price' },
        { label: 'Weight', value: 'weight' },
        { label: 'Quantity', value: 'quantity' },
        { label: 'Distance', value: 'distance' },
        { label: 'Local Code', value: 'localCode' },
        { label: 'Delivery', value: '', disabled: true, className: 'select-header' },
        { label: 'Day ', value: 'day' },
        { label: 'Date', value: 'date' },
        { label: 'X Day from today', value: 'dayFromToday' },
        { label: 'Type', value: 'type' },
        { label: 'X Estimated Delivery Day ', value: 'estimatedDay' },
        { label: 'X Time From Current Time', value: 'timefromCurrent' },
        { label: 'First Available Day', value: 'available' },
        { label: 'Any Product', value: '', disabled: true, className: 'select-header' },
        { label: 'Available Quan ', value: 'availableQuan' },
        { label: 'IDs', value: 'ids' },
        { label: 'Time', value: 'time2' },
        { label: 'Tag', value: 'tag' },
        { label: 'Type', value: 'type2' },
        { label: 'SKU', value: 'sku' },
        { label: 'Properties', value: 'properties' },
        { label: 'Vendor', value: 'vendor' },
        { label: 'Collection IDs', value: 'collectionsIds' },
        { label: 'Customer', value: '', disabled: true, className: 'select-header' },
        { label: 'Zip Code', value: 'zipcode' },
        { label: 'Name', value: 'name' },
        { label: 'City', value: 'city' },
        { label: 'Province Code', value: 'provinceCode' },
        { label: 'Address', value: 'address' },
        { label: 'Tag', value: 'tag2' },
        { label: 'Rate', value: '', disabled: true, className: 'select-header' },
        { label: 'Calculate Rate Price', value: 'calculateRate' },
        { label: 'Third Party Service', value: 'thirdParty' },
    ];

    const rateOperatorOptions = [
        { label: 'Equals', value: 'equals' },
        { label: 'Does Not Equal', value: 'not_equals' },
    ];

    const rateDayOptions = [
        { label: 'Select Day Of Order', value: 'selected' },
        { label: 'Sunday', value: 'sunday' },
        { label: 'Monday', value: 'monday' },
        { label: 'Tuesday', value: 'tuesday' },
        { label: 'Wednesday', value: 'wednesday' },
        { label: 'Thursday', value: 'thursday' },
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
    ];

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
            if (response.data.rate.zipcode.state) {
                const fetchedSelectedOptions = response.data.rate.zipcode.state.map(state => state.code);
                setSelectedOptions(fetchedSelectedOptions);
            }

            if (response.data.rate.exclude_rate_for_products) {
                setSelectedRate(response.data.rate.exclude_rate_for_products.set_exclude_products)
                SetExclude_Rate(response.data.rate.exclude_rate_for_products)
            }
            if (response.data.rate.rate_modifiers) {
                setRateModifiers(response.data.rate.rate_modifiers)

            }
            if (response.data.rate.cart_condition) {
                setCheckState(prevState => ({
                    ...prevState,
                    selectedCondition: response.data.rate.cart_condition.conditionMatch,
                }));
                setItems(response.data.rate.cart_condition.cartCondition)
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
                setsend_another_rate(response.data.rate.send_another_rate)
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

                }))
                Setrate_based_on_surcharge(response.data.rate.rate_based_on_surcharge.rate_based_on_surcharge)
            }

            if (response.data.rate.rate_tier) {
                setSelectedTierType(response.data.rate.rate_tier.tier_type)
                setTiers(response.data.rate.rate_tier.rateTier)
            }

            setFormData({
                name: response.data.rate.name,
                base_price: response.data.rate.base_price,
                service_code: response.data.rate.service_code,
                description: response.data.rate.description,
                id: response.data.rate.id,
                zone_id: response.data.rate.zone_id,
                status: response.data.rate.status,
                merge_rate_tag: response.data.rate.merge_rate_tag
            });

            if (response.data.rate.scheduleRate) {
                setDates(prevState => ({
                    ...prevState,
                    startDate: moment(response.data.rate.scheduleRate.schedule_start_date_time, "DD-MM-YYYY hh:mm A").format("YYYY-MM-DD"),
                    endDate: moment(response.data.rate.scheduleRate.schedule_end_date_time, "DD-MM-YYYY hh:mm A").format("YYYY-MM-DD"),
                }));
                setCheckState(prevState => ({
                    ...prevState,
                    selectedByschedule: response.data.rate.scheduleRate.schedule_rate,
                }));
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

        } catch (error) {
            console.error("Error fetching shop location:", error);
        }
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
        setFilteredProducts(products);
    }, [products]);


    const resourceName = {
        singular: 'order',
        plural: 'products',
    };
    const handleSearchClick = () => {
        setShowTable(true);

    };


    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(filteredProducts);

    const rowMarkup = filteredProducts.map(({ id, title, image, price }, index) => (
        <IndexTable.Row
            id={id}
            key={id}
            selected={selectedResources.includes(id)}
            position={index}
        >
            <IndexTable.Cell>

                <Thumbnail
                    source={image}
                    size="large"
                    alt="Black choker necklace"
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
                    type="text"
                    prefix="$"
                    placeholder='0.00'
                />
            </IndexTable.Cell>
        </IndexTable.Row>
    ));

    const handleNextPage = () => {
        if (hasNextPage) {
            fetchProducts(endCursor);
        }
    };

    const handlePreviousPage = () => {
        if (hasPreviousPage) {
            fetchProducts(startCursor);
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
        { label: 'Equal', value: 'equal' },
        { label: 'Does Not Eqaul', value: 'notequal' },
        { label: 'Greatre then or Eqaul', value: 'gthenoequal' },
        { label: 'Less then or Eqaul', value: 'lthenoequal' },
        { label: 'Between', value: 'between' },
    ];

    const time = [
        { label: '00:00', value: '00' },
        { label: '01:00', value: '01' },
        { label: '02:00', value: '03' },
        { label: '03:00', value: '03' },
        { label: '04:00', value: '04' },
        { label: '05:00', value: '05' },
        { label: '06:00', value: '06' },
        { label: '07:00', value: '07' },
        { label: '08:00', value: '08' },
        { label: '09:00', value: '09' },
        { label: '10:00', value: '10' },
        { label: '11:00', value: '11' },
        { label: '12:00', value: '12' },
        { label: '13:00', value: '13' },
        { label: '14:00', value: '14' },
        { label: '15:00', value: '15' },
        { label: '16:00', value: '16' },
        { label: '17:00', value: '17' },
        { label: '18:00', value: '18' },
        { label: '19:00', value: '19' },
        { label: '20:00', value: '20' },
        { label: '21:00', value: '21' },
        { label: '22:00', value: '22' },
        { label: '23:00', value: '23' },
        { label: '24:00', value: '24' }
    ];

    const lineItem = [
        { label: 'ANY product must satisfy this conditin ', value: 'satisfy' },
        { label: 'ANY SPECIFIC product with TAg', value: 'withTag' },
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
    const quantity = [
        { label: 'ANY product must satisfy this conditin ', value: 'any' },
        { label: 'ALL product must satisfy this conditin ', value: 'all' },
        { label: 'NONE of product must satisfy this conditin ', value: 'none' },
        { label: 'ANY SPECIFIC product with TAg', value: 'anyTag' },
        { label: 'ALL SPECIFIC product with TAg', value: 'allTag' },

    ]

    const [deliveryType, setDeliveryType] = useState([{
        id: 0,
        local: false,
        Store: false,
        Shipping: false,

    }]);
    const [dayOfWeekSelection, setDayOfWeekSelection] = useState({
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
    });
    const [items, setItems] = useState([]);
    // console.log(items)

    const handleCheckboxChange = useCallback((type, index) => {
        setDeliveryType((prevState) => {
            const updatedItems = [...prevState];
            updatedItems[index] = {
                ...updatedItems[index],
                [type]: !updatedItems[index][type],
            };
            return updatedItems;
        });

    }, [items]);

    const handleDayCheckboxChange = useCallback((type) => {
        setDayOfWeekSelection((prevSelection) => {
            const updatedSelection = {
                ...prevSelection,
                [type]: !prevSelection[type],
            };
            const selectedTypes = Object.keys(updatedSelection).filter(key => updatedSelection[key]);
            const selectedTypesString = selectedTypes.join(', ');
            const existingItemIndex = items.findIndex(item => item.name === 'dayOfWeek');
            if (existingItemIndex !== -1) {
                const updatedItems = [...items];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    value: selectedTypesString,
                };
                setItems(updatedItems);
            }

            return updatedSelection;
        });



    }, [items]);

    const CheckboxGroup = ({ selection, onChange }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {Object.keys(selection).map((day) => (
                <Checkbox
                    key={day}
                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                    checked={selection[day]}
                    onChange={() => onChange(day)}
                />
            ))}
        </div>
    );

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
        { label: 'Quantity', value: 'quantity', unit: 'items', mainLabel: "Cart_Order" },
        { label: 'Total', value: 'total', unit: '.Rs', mainLabel: "Cart_Order" },
        { label: 'Sale Product Total', value: 's&ptotal', unit: '.Rs', mainLabel: "Cart_Order" },
        { label: 'Non Sale Product Total', value: 'ns&ptotal', unit: '.Rs', mainLabel: "Cart_Order" },
        { label: 'Weight', value: 'weight', unit: 'kg', mainLabel: "Cart_Order" },
        { label: 'Line Item', value: 'lineitem', mainLabel: "Cart_Order" },
        { label: 'Distance', value: 'distance', unit: 'km', mainLabel: "Cart_Order" },
        { label: 'Day', value: 'day', mainLabel: "Cart_Order" },
        { label: 'Time', value: 'time', mainLabel: "Cart_Order" },
        { label: 'Local Code', value: 'localcode', mainLabel: "Cart_Order" },

        { label: 'Per Product', value: '', disabled: true, className: 'select-header' },
        { label: 'Quantity', value: 'quantity2', mainLabel: 'Per_Product' },
        { label: 'Price', value: 'price', mainLabel: 'Per_Product' },
        { label: 'Total', value: 'total2', mainLabel: 'Per_Product' },
        { label: 'Weight', value: 'weight2', mainLabel: 'Per_Product' },
        { label: 'Name', value: 'name', mainLabel: 'Per_Product' },
        { label: 'Tag', value: 'tag', mainLabel: 'Per_Product' },
        { label: 'SKU', value: 'sku', mainLabel: 'Per_Product' },
        { label: 'Type', value: 'type', mainLabel: 'Per_Product' },
        { label: 'Vendor', value: 'vendor', mainLabel: 'Per_Product' },
        { label: 'Properties', value: 'properties', mainLabel: 'Per_Product' },

        { label: 'Customer', value: '', disabled: true, className: 'select-header' },
        { label: 'Name', value: 'name2', mainLabel: 'Customer' },
        { label: 'Email', value: 'email', mainLabel: 'Customer' },
        { label: 'Phone', value: 'phone', mainLabel: 'Customer' },
        { label: 'Compnay', value: 'company', mainLabel: 'Customer' },
        { label: 'Address', value: 'address', mainLabel: 'Customer' },
        { label: 'Address1', value: 'addrss1', mainLabel: 'Customer' },
        { label: 'Address2', value: 'address2', mainLabel: 'Customer' },
        { label: 'City', value: 'city', mainLabel: 'Customer' },
        { label: 'Province COde', value: 'provinceCode', mainLabel: 'Customer' },
        { label: 'Tag', value: 'tag2', mainLabel: 'Customer' },
        { label: 'Previous Orders Count', value: 'previousCount', mainLabel: 'Customer' },
        { label: 'Previous Orders Spent ', value: 'previousSpent', mainLabel: 'Customer' },

        { label: 'Delivery', value: '', disabled: true, className: 'select-header' },
        { label: 'Day Of Week', value: 'dayOfWeek', mainLabel: "Delivery" },
        { label: 'Day Is', value: 'dayIs', mainLabel: "Delivery" },
        { label: 'Date', value: 'date', mainLabel: "Delivery" },
        { label: 'Time In', value: 'timeIn', mainLabel: "Delivery" },
        { label: 'Type', value: 'type2', mainLabel: "Delivery" }
    ];

    const handleAddItem = () => {
        const newItem = {
            name: 'quantity',
            condition: 'equal',
            value: '',
            value2: '',
            unit: '',
            label: 'cart_order',
            lineItem: 'satisfy',
            textBoxValue: '',
            time1: '00',
            time2: '00',
            per_product: 'any',
            date: dates.date
        };
        setItems(prevItems => [...prevItems, newItem]);

        // setDayOfWeekSelection({});
        
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
            setDeliveryType((prevState) => {
                const updatedItems = [...prevState];
                updatedItems[index] = {
                    id: index,
                    local: false,
                    Store: false,
                    Shipping: false,
                };
                updatedItems[index] = {
                    ...updatedItems[index],
                };

                return updatedItems;
            });
        }
        const updatedItem = {
            ...items[index],
            name: isSecondSelect ? items[index].name : newValue,
            condition: isSecondSelect ? newValue : items[index].condition,
            unit: selectedOption.unit || '',
            label: selectedOption.mainLabel
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
    }, []);


    useEffect(() => {
        if (rate_id) {
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
        product_title: '',
        collecion_id: '',
        product_type: '',
        product_vendor: '',
        descriptions: '',

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

    useEffect(() => {
        setsend_another_rate(prevState => ({
            ...prevState,
            send_another_rate: checkedState.checked3,
            update_price_type: checkstate.selectedByUpdatePriceType,
            update_price_effect: checkstate.selectedByUpdatePriceEffect
        }));
    }, [checkedState.checked3, checkstate.selectedByUpdatePriceType, checkstate.selectedByUpdatePriceEffect]);


    const [exclude_Rate, SetExclude_Rate] = useState({
        set_exclude_products: selectedRate,
        exclude_products_radio: checkstate.exclude_products_radio,
        product_title: '',
        collection_id: '',
        product_type: '',
        product_vendor: '',
        exclude_products_textbox: ''
    })

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
            rateTier: tiers
        },
        scheduleRate: {
            schedule_rate: checkstate.selectedByschedule,
            schedule_start_date_time: dates.startDate,
            schedule_end_date_time: dates.endDate

        },
        rate_based_on_surcharge: {
            cart_and_product_surcharge: checkstate.selectedByCart,
            based_on_cart: checkedState.checked1,
            selectedByAmount: checkstate.selectedByAmount,
            selectedMultiplyLine: checkstate.selectedMultiplyLine,
            rate_based_on_surcharge
        },
        rate_modifiers: rateModifiers,
        exclude_rate_for_products: exclude_Rate,
        status: 1,
        merge_rate_tag: ''
    });

    const removeEmptyFields = (obj) => {
        return Object.keys(obj).reduce((acc, key) => {
            if (obj[key] !== '') {
                acc[key] = obj[key];
            }
            return acc;
        }, {});
    };

    const handleRateFormChange = (field) => (value) => {
        setFormData((prevState) => ({
            ...prevState,
            [field]: value,
        }));

        setsend_another_rate((prevState) => ({
            ...prevState,
            [field]: value,
        }));

        Setrate_based_on_surcharge((prevState) => {
            const updatedState = {
                ...prevState,
                [field]: value,
            };
            return removeEmptyFields(updatedState);
        });

        SetExclude_Rate((prevState) => ({
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
            },
            scheduleRate: {
                ...prevFormData.scheduleRate,
                schedule_rate: checkstate.selectedByschedule,
                schedule_start_date_time: dates.startDate,
                schedule_end_date_time: dates.endDate
            },
            rate_based_on_surcharge: {
                ...prevFormData.rate_based_on_surcharge,
                cart_and_product_surcharge: checkstate.selectedByCart,
                based_on_cart: checkedState.checked1,
                selectedByAmount: checkstate.selectedByAmount,
                selectedMultiplyLine: checkstate.selectedMultiplyLine,
                rate_based_on_surcharge
            },
            rate_tier: {
                ...prevFormData.rate_tier,
                tier_type: selectedTierType,
                rateTier: tiers
            },
            send_another_rate: send_another_rate,
            exclude_rate_for_products: exclude_Rate,
            rate_modifiers: rateModifiers,
        }));
    }, [
        selectedOptions, items, zipcodeValue, checkstate.selectedCondition,
        checkstate.selectedStateCondition, checkstate.selectedZipCondition,
        checkstate.selectedZipCode, state, checkstate.selectedByschedule,
        checkstate.selectedByCart, dates, rate_based_on_surcharge,
        checkedState.checked1, checkstate.selectedByAmount,
        checkstate.selectedMultiplyLine, selectedTierType, tiers,
        exclude_Rate, rateModifiers, send_another_rate,
        checkedState.checked3, checkstate.selectedByUpdatePriceType,
        checkstate.selectedByUpdatePriceEffect
    ]);

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

        // if (items.length > 0) {
        //     items.forEach((item, index) => {
        //         if (!item.value) newErrors[`value${index}`] = `Value for Item  is required`;
        //     });
        // }

        if (checkstate.selectedStateCondition !== 'All' && selectedOptions.length === 0) {
            newErrors.selectedOptions = 'Please select at least one country.';
        }
        if (checkstate.selectedZipCondition !== 'All' && !zipcodeValue) {
            newErrors.zipcodeValue = 'The zipcodes field is required.';
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
        }



        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setToastContent('Sorry. Couldn’t be saved. Please try again.');
            console.log(newErrors)
            setErroToast(true);
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
                    Authorization: `Bearer ${token}`,
                },
            });
            setErrors({});
            setToastContent('Rate saved successfully');
            setShowToast(true);
            // setTimeout(() => {
            //     navigate(`/Zone/${zone_id}`);
            // }, 1000);
        } catch (error) {
            console.error('Error occurs', error);
            setToastContent('Error occurred while saving data');
            setShowToast(true);
        }
    };

    const fetchProducts = async () => {
        try {
            const token = await getSessionToken(app);

            const response = await axios.post(`${apiCommonURL}/api/products`, product, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const productData = response.data;
            setProducts(productData.products);
            setFilteredProducts(productData.products);
            setStartCursor(productData.startCursor);
            setEndCursor(productData.endCursor);
            setHasNextPage(productData.hasNextPage);
            setHasPreviousPage(productData.hasPreviousPage);
            setLoading(false)
        } catch (error) {
            console.error('Error fetching product data:', error);
        }
    };

    if (loading) {
        return (
            <Page
                title={rate_id ? 'Edit Rate' : 'Add Rate'}
                primaryAction={<Button variant="primary" onClick={saveRate}>Save</Button>}
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
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        Specify which rates should apply in this zone
                                    </List.Item>
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
                                            <div key={index}>
                                                <Grid>
                                                    <Grid.Cell columnSpan={{ xs: 2, sm: 3, md: 3, lg: 2, xl: 2 }}>
                                                        <div style={{ paddingTop: '20%', }}>
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
                                                                gap: '5%',
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

                                                                {item.name !== 'dayOfWeek' && item.name !== 'type2' && item.name !== 'date' && item.name !== 'dayIs' && item.name !== 'day' && item.name !== 'time' && (
                                                                    <TextField
                                                                        value={item.value}
                                                                        onChange={(newValue) => handleConditionChange(newValue, index, 'value')}
                                                                        autoComplete="off"
                                                                        suffix={item.unit ? item.unit : ''}
                                                                        error={errors[`value${index}`]}
                                                                    />
                                                                )}
                                                                {item.condition === 'between' && (
                                                                    <TextField
                                                                        value={item.value2}
                                                                        onChange={(newValue) => handleConditionChange(newValue, index, 'value2')}
                                                                        autoComplete="off"
                                                                        suffix={item.unit ? item.unit : ''}
                                                                    />
                                                                )}
                                                                {item.name === 'dayIs' && (
                                                                    <TextField
                                                                        value={item.value}
                                                                        onChange={(newValue) => handleConditionChange(newValue, index, 'value')}
                                                                        autoComplete="off"
                                                                        placeholder='Delivery X days from today is'
                                                                    />
                                                                )}

                                                                {item.name === 'time' && (
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10%',
                                                                    }}>
                                                                        <Select
                                                                            options={time}
                                                                            onChange={handleConditionsChange('time1')}
                                                                            value={item.time1}
                                                                        />
                                                                        <Select
                                                                            options={time}
                                                                            onChange={handleConditionsChange('time2')}
                                                                            value={item.time2}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {(item.name === 'day' || item.name === 'dayOfWeek') && (
                                                                    <CheckboxGroup
                                                                        selection={dayOfWeekSelection}
                                                                        onChange={handleDayCheckboxChange}
                                                                    />
                                                                )}
                                                                {item.name === 'date' && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                        <TextField
                                                                            value={dates.date}
                                                                            onChange={(value) => handleDateChange('date', value)}
                                                                            type="date"
                                                                        />
                                                                    </div>
                                                                )}
                                                                {/* {item.name === 'date' && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                        <TextField
                                                                            value={dates.date}
                                                                            onChange={(value) => handleDateChange('date', value)}
                                                                            type="date"
                                                                        />
                                                                    </div>
                                                                )} */}
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
                                                                marginBottom: "2%"


                                                            }}>
                                                                {item.name === 'lineitem' && (
                                                                    <Select
                                                                        options={lineItem}
                                                                        onChange={handleConditionsChange('lineItem')}
                                                                        value={item.lineItem}
                                                                    />
                                                                )}
                                                                {/* {item.lineItem === 'withTag' && (
                                                                    <TextField

                                                                        value={item.textBoxValue}
                                                                        onChange={handleConditionsChange('textBoxValue')}
                                                                        placeholder='tag1,tag2,tag3'
                                                                    />
                                                                )} */}
                                                            </div>
                                                            {(item.name === 'quantity2' || item.name === 'price' || item.name === 'total2' || item.name === 'weight2' || item.name === 'name' || item.name === 'tag' || item.name === 'sku' || item.name === 'type' || item.name === 'vendor' || item.name === 'properties') && (
                                                                <div style={{ marginBottom: "2%" }}>

                                                                    <Select
                                                                        key={index}
                                                                        options={quantity}
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
                                            Add Theme
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
                                                        prefix="Rs."
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
                                                        prefix="Rs."
                                                        placeholder='0'
                                                        value={rate_based_on_surcharge.min_charge_price}
                                                        onChange={handleRateFormChange('min_charge_price')}
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Maximum Charge Price"
                                                        autoComplete="off"
                                                        prefix="Rs."
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
                                                />
                                                <FormLayout.Group>
                                                    <TextField
                                                        type="text"
                                                        label="Charge Per Weight"
                                                        value={rate_based_on_surcharge.charge_per_wight}
                                                        onChange={handleRateFormChange('charge_per_wight')}
                                                        autoComplete="off"
                                                        prefix="Rs."
                                                        placeholder='0'

                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Unit For Weight"
                                                        value={rate_based_on_surcharge.unit_for}
                                                        onChange={handleRateFormChange('unit_for')}
                                                        autoComplete="off"
                                                        prefix="kg"
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
                                                                    value={rate_based_on_surcharge.product_title}
                                                                    onChange={handleRateFormChange('product_title')}
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Enter Collection ID"
                                                                    autoComplete="off"
                                                                    placeholder='Enter Collection ID'
                                                                    value={rate_based_on_surcharge.collecion_id}
                                                                    onChange={handleRateFormChange('collecion_id')}
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
                                                                    value={rate_based_on_surcharge.product_type}
                                                                    onChange={handleRateFormChange('product_type')}
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    label="Full Product Vendor"
                                                                    autoComplete="off"
                                                                    placeholder='Enter Full Product Vendor'
                                                                    value={rate_based_on_surcharge.product_vendor}
                                                                    onChange={handleRateFormChange('product_vendor')}
                                                                />
                                                            </FormLayout.Group>
                                                        </FormLayout>
                                                    </div>
                                                    <p style={{ marginTop: "2%" }}>Note: Please enter the exact term for product title, collection id, product type, and product vendor that needs to be searched.
                                                    </p>
                                                    <div style={{ marginTop: "2%", width: '20%' }} onClick={handleSearchClick}>
                                                        <Button variant="primary" >Search Product</Button></div>

                                                    <div style={{ marginTop: "4%" }}>
                                                        {showTable && (

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
                                                                        itemCount={filteredProducts.length}
                                                                        selectedItemsCount={
                                                                            allResourcesSelected ? 'All' : selectedResources.length
                                                                        }
                                                                        onSelectionChange={handleSelectionChange}
                                                                        headings={[
                                                                            { title: 'Image' },
                                                                            { title: 'Title' },
                                                                            { title: 'Price' },
                                                                            { title: 'Rate Price' },



                                                                        ]}
                                                                        pagination={{
                                                                            hasNext: hasNextPage,
                                                                            hasPrevious: hasPreviousPage,
                                                                            onNext: handleNextPage,
                                                                            onPrevious: handlePreviousPage,
                                                                        }}
                                                                    >
                                                                        {rowMarkup}
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
                            <div >
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
                                                            prefix="kg"
                                                            placeholder="0.00"
                                                            error={errors[`minWeight${index}`]}
                                                        />
                                                        <TextField
                                                            label={`Maximum ${selectedTierType === 'order_weight' ? 'Weight' : selectedTierType === 'order_quantity' ? 'Quantity' : selectedTierType === 'order_distance' ? 'Distance' : 'Price'}`}
                                                            value={tier.maxWeight}
                                                            onChange={(value) => handleInputChange(index, 'maxWeight', value)}
                                                            autoComplete="off"
                                                            prefix="kg"
                                                            placeholder="0.00"
                                                            error={errors[`maxWeight${index}`]}

                                                        />
                                                        <TextField
                                                            label='Base Price'
                                                            value={tier.basePrice}
                                                            onChange={(value) => handleInputChange(index, 'basePrice', value)}
                                                            autoComplete="off"
                                                            prefix="Rs."
                                                            placeholder="0.00"
                                                            error={errors[`basePrice${index}`]}

                                                        />
                                                    </FormLayout.Group>

                                                </FormLayout>
                                                {index < tiers.length - 1 && <div style={{ marginTop: "3%" }}> <Divider /></div>}
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
                                                    value={exclude_Rate.product_title}
                                                    onChange={handleRateFormChange('product_title')}
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
                                </div>
                            )}

                            {(selectedRate === 'product_vendor' || selectedRate === 'product_sku' || selectedRate === 'product_type' || selectedRate === 'product_properties') && (
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
                                                    selectedRate === 'product_type' ? 'Product Type' : 'Product Properties'
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
                                    <div style={{ marginBottom: "3%" }}>
                                        <Box key={index} borderColor="border" borderWidth="025">
                                            <div style={{ padding: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Button
                                                        onClick={handleToggle(modifier.id)}
                                                        ariaExpanded={open[modifier.id]}
                                                        ariaControls={`collapsible-${modifier.id}`}
                                                        icon={SelectIcon}
                                                    />
                                                    <p
                                                        style={{ color: '#ef5350', fontWeight: 'bold', cursor: 'pointer' }}
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
                                                            id="None"
                                                            name="type"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'type')('None')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="AND"
                                                            checked={modifier.type === 'AND'}
                                                            id="AND"
                                                            name="type"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'type')('AND')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="OR"
                                                            checked={modifier.type === 'OR'}
                                                            id="OR"
                                                            name="type"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'type')('OR')
                                                            }
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
                                                            <Select
                                                                label="Select Operator"
                                                                options={rateOperatorOptions}
                                                                value={modifier.rateOperator}
                                                                onChange={handleRateModifierChange(modifier.id, 'rateOperator')}
                                                            />
                                                        </FormLayout.Group>
                                                    </FormLayout>
                                                    <div style={{ marginTop: '4%', marginBottom: '3%' }}>
                                                        <Select
                                                            options={rateDayOptions}
                                                            value={modifier.rateDay}
                                                            onChange={handleRateModifierChange(modifier.id, 'rateDay')}
                                                        />
                                                    </div>
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
                                                            Behaviour :
                                                        </Text>
                                                        <RadioButton
                                                            label="Stack"
                                                            checked={modifier.behaviour === 'Stack'}
                                                            id="Stack"
                                                            name="behaviour"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'behaviour')('Stack')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="Terminate"
                                                            checked={modifier.behaviour === 'Terminate'}
                                                            id="Terminate"
                                                            name="behaviour"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'behaviour')('Terminate')
                                                            }
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
                                                            Modifier Type :
                                                        </Text>
                                                        <RadioButton
                                                            label="Fixed"
                                                            checked={modifier.modifierType === 'Fixed'}
                                                            id="Fixed"
                                                            name="modifierType"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'modifierType')('Fixed')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="Percentage"
                                                            checked={modifier.modifierType === 'Percentage'}
                                                            id="Percentage"
                                                            name="modifierType"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'modifierType')('Percentage')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="Static"
                                                            checked={modifier.modifierType === 'Static'}
                                                            id="Static"
                                                            name="modifierType"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'modifierType')('Static')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="Remove Rate"
                                                            checked={modifier.modifierType === 'RemoveRate'}
                                                            id="RemoveRate"
                                                            name="modifierType"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'modifierType')('RemoveRate')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="Show Only"
                                                            checked={modifier.modifierType === 'ShowOnly'}
                                                            id="ShowOnly"
                                                            name="modifierType"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'modifierType')('ShowOnly')
                                                            }
                                                        />
                                                    </div>

                                                    <Divider borderColor="border" />
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',

                                                        marginTop: '3%',
                                                        marginBottom: '3%',
                                                        justifyContent: "space-between"
                                                    }}>
                                                        <Text variant="headingXs" as="h6">
                                                            Effect :
                                                        </Text>
                                                        <RadioButton
                                                            label="Increase"
                                                            checked={modifier.effect === 'Increase'}
                                                            id="Increase"
                                                            name="effect"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'effect')('Increase')
                                                            }
                                                        />
                                                        <RadioButton
                                                            label="Decrease"
                                                            checked={modifier.effect === 'Decrease'}
                                                            id="Decrease"
                                                            name="effect"
                                                            onChange={() =>
                                                                handleRateModifierChange(modifier.id, 'effect')('Decrease')
                                                            }
                                                        />
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
                                value={formData.merge_rate_tag}
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
                                    id="Yes"
                                    name="Yes"
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
                                            value={dates.startDate}
                                            onChange={(value) => handleDateChange('startDate', value)}
                                            type="date"
                                        />
                                        <TextField
                                            label="End Date"
                                            value={dates.endDate}
                                            onChange={(value) => handleDateChange('endDate', value)}
                                            type="date"
                                        />
                                    </FormLayout.Group>
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
        </Page>
    );
}
export default Rate;
