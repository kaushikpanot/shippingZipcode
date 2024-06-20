import React, { useState, useCallback } from 'react';
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
    Link
} from '@shopify/polaris';
import '../../../public/css/style.css';
import {
    SearchIcon,
    ResetIcon
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';




function Help() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(['enable']);
    const handleChange = useCallback((value) => setSelected(value), []);
    const [checked, setChecked] = useState(false);
    const handlecehckbox = useCallback(
        (newChecked) => setChecked(newChecked),
        [],
    );
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
    console.log('navigat')
  };
    return (
        <Page
            fullWidth
            title="Add Zone"
            primaryAction={<Button variant="primary">Save</Button>}
            secondaryActions={<Button onClick={navigateHome}>Back</Button>}
        >
            <Divider borderColor="border" />
            <div style={{ marginTop: '2%', marginBottom: "2%" }}>
                <Grid>
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
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
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
                                    label="Zone Name (Internal Use Only)"
                                    placeholder="West Zone"
                                    autoComplete="off"
                                />
                            </div>
                            <div style={{ marginTop: "2%" }} className='zonetext'>
                                <TextField
                                    label="Country"
                                    placeholder="West Zone"
                                    autoComplete="off"
                                    helpText="NOTE: Make sure you enable this country on your default Shopify manage rates, you can see here."
                                />
                            </div>
                            <div style={{ marginTop: "2%", marginBottom: "2%" }} className='zonetext'>
                                <TextField
                                    label="Currency Format"
                                    placeholder="West Zone"
                                    autoComplete="off"
                                    helpText="NOTE: Make sure you enable this currency on your Shopify markets, you can see here."

                                />
                            </div>
                            {/* <Divider borderColor="border-inverse" />
              <div style={{ marginTop: "2%" }}>
                <Tooltip active content="Enable Or Disable Rate">
                  <Checkbox
                    checked={checked}
                    label="All rates for this zone will be updated according to below:"
                    onChange={handlecehckbox}
                  />
                </Tooltip>
              </div> */}
                        </LegacyCard>
                    </Grid.Cell>
                </Grid>
            </div>
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}></Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
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
                        <div style={{ marginTop: "2%" }}>
                            <ButtonGroup>
                                <Button variant="primary" icon={ResetIcon} />
                                <Button variant="primary" icon={SearchIcon} />
                                <Button variant="primary" onClick={() => handleEditForm()}>Add Rate</Button>
                            </ButtonGroup>
                        </div>
                    </Grid.Cell>
                </Grid>
            </div>
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "5%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '5%' }}>
                            <Text variant="headingLg" as="h5">
                                Specify rates
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Specify shipping rates for this particular zone.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                        <Card>
                            <div style={{ textAlign: "center", paddingTop: "5%", paddingBottom: "5%", textDecoration: "none" }}>
                                <Link  onClick={() => handleEditForm()}> Click Here</Link> to add rate for this particular zone.
                            </div>
                        </Card>
                    </Grid.Cell>
                </Grid>
            </div>
        </Page>
    );
}

export default Help;
